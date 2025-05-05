<!-- src/components/AnalysisForm.vue -->
<template>
  <div class="analysis-container">
    <h2 class="title">上传对话文件进行分析</h2>

    <div class="form-section card">
      <div class="form-group">
        <label for="fileInput" class="label">选择 JSON 文件:</label>
        <div class="file-input-wrapper">
           <input
            type="file"
            id="fileInput"
            ref="fileInput"
            accept=".json"
            @change="handleFileChange"
            :disabled="isAnalyzing"
            class="hidden-file-input"
          />
          <button @click="triggerFileInput" :disabled="isAnalyzing" class="btn btn-secondary">
            {{ selectedFile ? '更换文件' : '选择文件' }}
          </button>
          <span v-if="selectedFile && selectedFile.name" class="selected-file-name">{{ selectedFile.name }}</span>
          <span v-else class="no-file-selected">未选择文件</span>
        </div>
      </div>

      <div class="form-group">
        <label for="limitInput" class="label">要处理的对话数量:</label>
        <input
          type="number"
          id="limitInput"
          v-model="limit"
          placeholder="留空或0表示所有"
          :disabled="isAnalyzing"
          class="input-field"
          min="0"
        />
      </div>

      <!-- Dynamic Button Text and State -->
      <button @click="uploadFile" :disabled="!selectedFile || isAnalyzing" class="btn btn-primary upload-btn">
        {{ isAnalyzing ? '分析进行中...' : (downloadLink ? '重新分析' : '上传并分析') }}
      </button>
    </div>

    <!-- Status, Progress, Logs and Results Area -->
    <div v-if="isAnalyzing || logs.length || downloadLink || errorMessage || finalResultJson || currentChatAnalysis" class="status-section card">
       <p class="overall-status-message">{{ overallStatusMessage || '等待开始...' }}</p> <!-- Show default if empty -->

       <!-- Progress Bar -->
       <div class="progress-bar-container" v-if="isAnalyzing && totalChatsForProgress > 0">
           <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
           <span class="progress-text">{{ Math.round(progressPercentage) }}%</span>
       </div>

       <!-- Current Chat Analysis Output -->
       <div v-if="currentChatAnalysis" class="current-analysis-output">
           <p class="output-title">当前对话分析结果 ({{ currentChatAnalysis.chat_id || '未知ID' }}):</p>
           <!-- Display parsed JSON from parsed_result message -->
           <pre class="json-display">{{ JSON.stringify(currentChatAnalysis, null, 2) }}</pre>
       </div>

        <!-- Detailed Logs Output -->
       <div class="log-output" v-if="logs.length">
         <p class="output-title">详细进度日志:</p>
         <div v-for="(log, index) in logs" :key="index" :class="['log-entry', log.type, {'json-parse-warning': log.isJsonParseWarning}]">
           <!-- Add icons for different types -->
           <span class="log-icon" v-if="log.type === 'status'">✅</span>
           <span class="log-icon" v-if="log.type === 'warning'">⚠️</span>
           <span class="log-icon" v-if="log.type === 'error' || log.type === 'fatal_error'">❌</span>
            <span class="log-icon" v-if="log.type === 'complete'">✨</span>
            <span class="log-icon" v-if="log.type === 'log_error'">❗</span>
             <span class="log-icon" v-if="log.type === 'log'">📄</span> <!-- Generic log icon for any 'log' type -->


           <span class="log-content">{{ log.message || log.content || log.details }}</span>
         </div>
       </div>


      <!-- Error Messages -->
      <div v-if="errorMessage && !isAnalyzing" class="message-box error">
        <p class="message-title">错误:</p>
        <p>{{ errorMessage }}</p>
        <pre v-if="errorDetails" class="message-details">{{ errorDetails }}</pre>
        <p class="message-hint">请检查后端控制台获取更详细信息。</p>
      </div>

      <!-- Success Message and Download Link -->
      <!-- FIX: Ensure v-if="downloadLink && !isAnalyzing" correctly shows this -->
      <div v-if="downloadLink && !isAnalyzing" class="message-box success">
        <p class="message-title">分析完成！</p>
        <a :href="downloadLink" download class="download-link">
            点击下载分析结果 Excel 文件 ({{ downloadFilename || 'result.xlsx' }})
        </a>
      </div>

      <!-- Final JSON Result (Optional - only if Python prints it) -->
      <div v-if="finalResultJson" class="final-result-json">
          <p class="output-title">最终分析结果汇总 (JSON):</p>
          <pre class="json-display">{{ JSON.stringify(finalResultJson, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, nextTick, computed } from 'vue';

const fileInput = ref(null);
const selectedFile = ref(null);
const limit = ref(null);

const overallStatusMessage = ref('');
const logs = ref([]); // Keep logs array for detailed view
const errorMessage = ref('');
const errorDetails = ref('');
const isAnalyzing = ref(false);
const downloadLink = ref('');
const downloadFilename = ref('');
const finalResultJson = ref(null);

const currentChatAnalysis = ref(null); // State for current chat analysis result

// For Progress Bar
const processedCount = ref(0);
const totalChatsForProgress = ref(0);

const progressPercentage = computed(() => {
    if (totalChatsForProgress.value <= 0) return 0;
    // Cap percentage at 100
    return Math.min(100, (processedCount.value / totalChatsForProgress.value) * 100);
});


let eventSource = null;

// --- Use environment variable for backend URL ---
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

if (!import.meta.env.VITE_BACKEND_URL && import.meta.env.MODE !== 'development') {
    // Only warn in non-production environments if not set
    console.warn("VITE_BACKEND_URL environment variable not set. Using fallback 'http://localhost:3001'.");
}
// ---------------------------------------------


onMounted(() => {
    resetState();
});

onBeforeUnmount(() => {
  if (eventSource) {
    eventSource.close();
    console.log('SSE connection closed on component unmount.');
  }
});

const triggerFileInput = () => {
    fileInput.value.click();
};

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
  resetState(); // Reset all states
};

const resetState = () => {
    overallStatusMessage.value = '';
    logs.value = []; // Clear logs
    errorMessage.value = '';
    errorDetails.value = '';
    isAnalyzing.value = false; // Ensure isAnalyzing is reset
    downloadLink.value = ''; // Clear download link
    downloadFilename.value = ''; // Clear download filename
    finalResultJson.value = null;
    currentChatAnalysis.value = null; // Reset current chat analysis
    processedCount.value = 0; // Reset progress
    totalChatsForProgress.value = 0; // Reset progress

     if (eventSource) {
        eventSource.close();
        eventSource = null;
     }
     if (fileInput.value) {
         fileInput.value.value = null;
     }
};

const uploadFile = async () => {
  if (!selectedFile.value) {
    alert('请先选择一个 JSON 文件。');
    return;
  }

  resetState(); // Clear previous state
  overallStatusMessage.value = '文件上传中...';
  isAnalyzing.value = true; // Set analyzing to true

  const formData = new FormData();
  formData.append('chatFile', selectedFile.value);

  const currentLimit = parseInt(limit.value, 10);
  if (!isNaN(currentLimit) && currentLimit >= 0) { // Allow limit 0
     formData.append('limit', currentLimit.toString());
     overallStatusMessage.value += ` (限制处理数量: ${currentLimit})`;
  } else {
      // If input is not a valid number or empty, don't send limit parameter
     overallStatusMessage.value += ' (处理所有对话)';
  }


  try {
    const uploadResponse = await fetch(`${backendUrl}/upload_and_analyze`, {
      method: 'POST',
      body: formData,
    });

    // Even if response.ok is false, we still want to read the body for error details
    const uploadData = await uploadResponse.json();


    if (uploadResponse.ok) {
      overallStatusMessage.value = uploadData.status || '文件上传成功，连接分析流...';
      downloadFilename.value = uploadData.outputFilename; // Store the expected output filename (used in complete event)

      connectToStream(); // Initiate SSE connection

    } else {
      errorMessage.value = uploadData.error || '上传或启动分析失败';
      errorDetails.value = uploadData.details || `Status: ${uploadResponse.status} ${uploadResponse.statusText}`;
      console.error('Upload/Initiate failed:', uploadData);
      isAnalyzing.value = false; // Analysis failed to start
    }
  } catch (error) {
    errorMessage.value = '请求发送失败或网络错误';
    errorDetails.value = error.message;
    console.error('Upload/Initiate fetch error:', error);
    isAnalyzing.value = false; // Analysis failed to start
  }
};

const connectToStream = () => {
    if (!window.EventSource) {
        errorMessage.value = "Your browser does not support Server-Sent Events. Please use a modern browser.";
        isAnalyzing.value = false; // Analysis failed to start due to browser support
        return;
    }

    overallStatusMessage.value = '连接到分析流...';
    logs.value.push({ type: 'status', message: 'Connecting to analysis stream...' });


    eventSource = new EventSource(`${backendUrl}/analysis_stream`);

    // --- onmessage: Handles messages without specific event names ---
    // Used for status updates, progress, and real-time log lines
    eventSource.onmessage = (event) => {
        try {
            const eventData = JSON.parse(event.data);

            // Handle different message types from backend payload (data.type)
            if (eventData.type === 'status') {
                overallStatusMessage.value = eventData.message;
                 logs.value.push({ type: 'status', message: eventData.message });

                 // Attempt to parse progress from status message
                 const progressMatch = eventData.message.match(/Processing chat \[(\d+)\/(\d+)\]/);
                 if (progressMatch && progressMatch[1] && progressMatch[2]) {
                     processedCount.value = parseInt(progressMatch[1], 10);
                     totalChatsForProgress.value = parseInt(progressMatch[2], 10);
                 } else {
                      // Also try to parse total chats from status messages at the start
                     const totalMatch1 = eventData.message.match(/Starting analysis for (\d+) chats/);
                      if (totalMatch1 && totalMatch1[1]) {
                          totalChatsForProgress.value = parseInt(totalMatch1[1], 10);
                          processedCount.value = 0; // Reset count when total is identified
                      }
                       const totalMatch2 = eventData.message.match(/Successfully loaded cleaned data\. Found (\d+) chats\./);
                        if (totalMatch2 && totalMatch2[1]) {
                           totalChatsForProgress.value = parseInt(totalMatch2[1], 10);
                            // Only reset processedCount if it seems like the start of analysis
                            if (processedCount.value < 1) processedCount.value = 0;
                       }
                 }

            } else if (eventData.type === 'log') {
                 logs.value.push({ type: 'log', message: eventData.message });
            } else if (eventData.type === 'log_error') {
                 logs.value.push({ type: 'log_error', message: eventData.message });
            } else if (eventData.type === 'parsed_result') { // --- NEW TYPE FOR PARSED JSON ---
                 // This message contains the SUCCESSFULLY PARSED JSON object for the *current* chat
                 try {
                      const parsedResponse = JSON.parse(eventData.content); // Content is the JSON string
                      // Store the parsed JSON object
                     currentChatAnalysis.value = parsedResponse;
                     console.log("Current Chat Analysis Received:", currentChatAnalysis.value);

                 } catch (e) {
                     console.error('Error parsing parsed_result JSON from stream:', e, eventData.content);
                     // This indicates an issue with the JSON string sent by Python after parsing
                     currentChatAnalysis.value = { "Error": "Failed to parse parsed_result JSON from stream.", "Content": eventData.content };
                     logs.value.push({ type: 'error', message: `Frontend JSON Parse Error (parsed_result): ${e.message}. Raw content: ${eventData.content.substring(0, 200)}...` });
                 }

            } else if (eventData.type === 'final_result_json') {
                 // Final aggregated JSON result (if sent)
                 finalResultJson.value = eventData.content;
                 logs.value.push({ type: 'status', message: 'Final JSON result received (see below).' });
            } else if (eventData.type === 'warning') {
                 logs.value.push({ type: 'warning', message: eventData.message });
            } else if (eventData.type === 'error') {
                 // Non-fatal error reported by Python during analysis
                 const isJsonParseWarn = eventData.message && typeof eventData.message === 'string' && eventData.message.includes('JSON Decode Error');
                 logs.value.push({ type: 'error', message: eventData.message, isJsonParseWarning: isJsonParseWarn });
                 if (isJsonParseWarn) {
                     console.warn('Recoverable JSON Parse Warning:', eventData.message);
                 } else {
                     console.error('Python Error (non-fatal):', eventData.message);
                 }

            } else if (eventData.type === 'fatal_error') {
                 // Fatal errors causing Python process to terminate
                 logs.value.push({ type: 'fatal_error', message: eventData.message });
                  // Fatal error is handled by the addEventListener('fatal_error') below which sets isAnalyzing = false
            } else if (eventData.type === 'complete') {
                 // Note: This is data.type === 'complete' within a 'message' SSE event.
                 // The actual completion signal that sets isAnalyzing=false is the SSE 'complete' event.
                 // logs.value.push({ type: 'complete', message: eventData.message || 'Analysis complete signal received (via onmessage).' }); // Can log this for info if needed
            } else {
                 // Catch any other message types or raw log lines without prefix
                 if (event.data && event.data.trim()) {
                      // Log anything else received as a generic log entry
                     logs.value.push({ type: 'log', message: event.data });
                 }
            }

        } catch (e) {
            // Handle parsing error of the SSE message itself
            console.error('Error parsing SSE message data:', e, event.data);
             logs.value.push({ type: 'error', message: `Frontend SSE Parse Error: ${e.message}. Raw data: ${event.data.substring(0, 200)}...`, isJsonParseWarning: false });
        }
        // Auto-scroll log output to bottom after Vue updates the DOM
        nextTick(() => {
           scrollToBottom('.log-output');
           // scrollToBottom('.current-analysis-output .json-display'); // Optional: keep this scrolled too
        });
    };

    // --- addEventListener('complete'): Handles the specific 'complete' SSE event ---
    // This is the signal that analysis has fully finished successfully.
    eventSource.addEventListener('complete', (event) => {
        try {
            const eventData = JSON.parse(event.data);
            overallStatusMessage.value = eventData.status || '分析完成';
            // *** CORRECT FIX: Prepend backendUrl to downloadUrl from the event data ***
            if (eventData.downloadUrl) {
                 downloadLink.value = `${backendUrl}${eventData.downloadUrl}`;
            } else {
                 console.error("Complete event data missing downloadUrl:", eventData);
                 errorMessage.value = "分析完成，但未收到下载链接。请检查后端日志。";
            }
            // ***********************************************************************
            downloadFilename.value = eventData.filename || 'result.xlsx';

             // Ensure progress bar reaches 100% on completion (visually)
             // If total is known, set processed = total. If not, just set progress to 100%.
             if (totalChatsForProgress.value > 0) {
                 processedCount.value = totalChatsForProgress.value;
             } else {
                 // Fallback if total wasn't parsed from logs
                 processedCount.value = 1; // Non-zero for percentage calc
                 totalChatsForProgress.value = 1; // Non-zero for percentage calc
             }


            // Clear current chat analysis on completion (optional, depends on desired UI)
            // currentChatAnalysis.value = null; // Keeping it for now might be useful

            logs.value.push({ type: 'complete', message: 'Analysis complete event received. Output file ready.' });
            console.log('Analysis complete event received:', eventData);
            console.log('Download Link Set:', downloadLink.value);


        } catch (e) {
             console.error('Error parsing complete event data:', e, event.data);
             errorMessage.value = '完成事件解析错误。';
             errorDetails.value = e.message;
             logs.value.push({ type: 'fatal_error', message: `Frontend Error: Error parsing complete event: ${e.message}. Raw data: ${event.data}` });

        } finally {
             isAnalyzing.value = false; // *** IMPORTANT: Set isAnalyzing to false on completion ***
             if (eventSource) {
                 eventSource.close();
                 eventSource = null;
             }
             // Scroll log output to ensure the 'complete' log is visible
             nextTick(() => { scrollToBottom('.log-output'); });
        }
    });

     // --- addEventListener('error'): Handles specific 'error' SSE event ---
     // This is for backend-detected non-fatal errors
     eventSource.addEventListener('error', (event) => {
         try {
             const eventData = JSON.parse(event.data);
             console.error('Analysis reported error (SSE event):', eventData);
             // Decide how to display non-fatal errors - add to logs
             logs.value.push({ type: 'error', message: `Analysis Error: ${eventData.message}` + (eventData.details ? ` Details: ${eventData.details}` : '') });
              // Non-fatal error doesn't stop analysis or set isAnalyzing=false
         } catch (e) {
             console.error('Error parsing SSE error event data:', e, event.data);
              logs.value.push({ type: 'error', message: `Frontend SSE Error Parse Error: ${e.message}. Raw data: ${event.data}` });
         } finally {
              nextTick(() => { scrollToBottom('.log-output'); });
         }
     });


     // --- addEventListener('fatal_error'): Handles specific 'fatal_error' SSE event ---
     // This is for errors that terminate the Python process or backend initiation failures
     eventSource.addEventListener('fatal_error', (event) => {
        try {
            const eventData = JSON.parse(event.data);
            errorMessage.value = eventData.message || '分析过程中发生致命错误';
            errorDetails.value = eventData.details || '请检查后端控制台获取更详细信息。';
            console.error('Analysis reported fatal error (SSE event):', eventData);
            logs.value.push({ type: 'fatal_error', message: `FATAL ERROR: ${eventData.message}` + (eventData.details ? ` Details: ${eventData.details}` : '') });
            // Clear current analysis on fatal error
            currentChatAnalysis.value = null;

        } catch (e) {
             console.error('Error parsing fatal_error event data:', e, event.data);
             logs.value.push({ type: 'fatal_error', message: `Frontend SSE Fatal Error Parse Error: ${e.message}. Raw data: ${event.data}` });
             errorMessage.value = '分析过程中发生致命错误';
             errorDetails.value = event.data || '未知致命错误详情，请检查后端控制台。';
        } finally {
            isAnalyzing.value = false; // *** IMPORTANT: Set isAnalyzing to false on fatal error ***
             if (eventSource) {
                 eventSource.close();
                 eventSource = null;
             }
             // Scroll log output to ensure the fatal error log is visible
             nextTick(() => { scrollToBottom('.log-output'); });
        }
     });


    // --- onerror: Handles SSE connection errors ---
    // Network errors, server shuts down, etc.
    eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            console.log("SSE connection was closed by server.");
            // Check if process was still supposed to be analyzing
            if (isAnalyzing.value) { // If we were analyzing and connection closed unexpectedly
                 errorMessage.value = "SSE 连接意外中断或服务器错误。";
                 errorDetails.value = err.message || `Status: ${err.status || 'N/A'}`;
                 logs.value.push({ type: 'fatal_error', message: errorMessage.value });
                 isAnalyzing.value = false; // *** IMPORTANT: Set isAnalyzing to false on connection error ***
                 currentChatAnalysis.value = null;
            }
             // If isAnalyzing was already false, it means analysis finished before connection closed (e.g., after complete/fatal_error event)
        } else { // Other connection errors (e.g., unable to connect)
             errorMessage.value = "SSE 连接错误。";
             errorDetails.value = err.message || `Status: ${err.status || 'N/A'}`;
             logs.value.push({ type: 'fatal_error', message: errorMessage.value });
             isAnalyzing.value = false; // *** IMPORTANT: Set isAnalyzing to false on connection error ***
             currentChatAnalysis.value = null;
        }

         if (eventSource) {
             eventSource.close();
             eventSource = null;
         }
         // Scroll log output to ensure the error log is visible
         nextTick(() => { scrollToBottom('.log-output'); });
    };

    // --- onopen: Handles successful SSE connection ---
    eventSource.onopen = () => {
      console.log('SSE connection opened.');
      overallStatusMessage.value = '分析流已连接，等待处理开始...';
       logs.value.push({ type: 'status', message: 'SSE connection opened.' });
         nextTick(() => { scrollToBottom('.log-output'); });
    };
};

const scrollToBottom = (selector) => {
  const element = document.querySelector(selector);
  if (element) {
    requestAnimationFrame(() => {
       element.scrollTop = element.scrollHeight;
    });
  }
};

</script>

<style scoped>
/* Basic Reset and Box Sizing */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; color: #343a40; line-height: 1.6; }

.analysis-container { max-width: 800px; margin: 40px auto; padding: 30px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15); border: 1px solid #e9ecef; }
.title { text-align: center; color: #0056b3; margin-bottom: 30px; font-size: 2em; font-weight: 700; }

.card { background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); padding: 20px; margin-bottom: 20px; border: 1px solid #dee2e6; }

.form-section { padding: 25px; background-color: #f8f9fa; }
.form-group { margin-bottom: 25px; }
.label { display: block; margin-bottom: 8px; font-weight: 600; color: #495057; font-size: 1em; }

.file-input-wrapper { display: flex; align-items: center; gap: 10px; }
.hidden-file-input { display: none; }
.btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; transition: background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease; font-weight: 500; }
.btn-primary { background-color: #007bff; color: white; }
.btn-primary:hover:not(:disabled) { background-color: #0056b3; box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3); }
.btn-secondary { background-color: #6c757d; color: white; }
.btn-secondary:hover:not(:disabled) { background-color: #5a6268; box-shadow: 0 2px 6px rgba(108, 117, 125, 0.3); }
.btn:disabled { background-color: #cccccc; cursor: not-allowed; opacity: 0.7; }
.upload-btn { display: block; width: 100%; text-align: center; padding: 12px 20px; font-size: 1.15em; font-weight: 600; margin-top: 20px; }

.input-field { display: block; width: 100%; padding: 10px 12px; font-size: 1em; line-height: 1.5; color: #495057; background-color: #fff; border: 1px solid #ced4da; border-radius: 4px; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
.input-field:focus { border-color: #80bdff; outline: 0; box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25); }

.selected-file-name { font-style: italic; color: #5a6268; flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.no-file-selected { color: #888; flex-grow: 1; }

.status-section { padding: 25px; background-color: #ffffff; border: 1px solid #007bff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2); }

.overall-status-message { font-weight: 700; color: #004085; margin-bottom: 20px; font-size: 1.2em; text-align: center; }

/* Progress Bar Styling */
.progress-bar-container { width: 100%; height: 25px; background-color: #e9ecef; border-radius: 12px; overflow: hidden; margin-bottom: 25px; position: relative; }
.progress-bar { height: 100%; background-color: #28a745; transition: width 0.4s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; }
.progress-text { position: absolute; width: 100%; text-align: center; line-height: 25px; color: #343a30; font-weight: 600; text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8); z-index: 1; }

/* Output Titles */
.output-title { font-weight: 600; margin-bottom: 15px; border-bottom: 1px dashed #a0a0a0; padding-bottom: 8px; font-size: 1.1em; color: #495057; }


/* Detailed Logs Output */
.log-output { margin-top: 20px; max-height: 250px; overflow-y: auto; padding-top: 0; font-size: 0.85em; background-color: #fcfcfc; border-radius: 6px; padding: 15px; border: 1px solid #eee; }

.log-entry { margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; word-break: break-word; white-space: pre-wrap; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; line-height: 1.5; display: flex; align-items: flex-start; background-color: #e9ecef; border: 1px solid #dee2e6; }
.log-icon { margin-right: 10px; font-size: 1.2em; line-height: 1.5; flex-shrink: 0; }
.log-content { flex-grow: 1; word-wrap: break-word; }

.log-entry.status { color: #0056b3; background-color: #e2f0ff; font-weight: bold; border-color: #b8daff; }
.log-entry.log { color: #343a40; background-color: #f8f9fa; border-color: #e9ecef; }
.log-entry.log_error { color: #dc3545; background-color: #f8d7da; border-color: #f5c6cb; }
.log-entry.warning { color: #ffc107; background-color: #fff3cd; border-color: #ffeeba; }
.log-entry.error { color: #dc3545; background-color: #f8d7da; font-weight: bold; border-left: 3px solid #dc3545; padding-left: 5px; }
.log-entry.fatal_error { color: #721c24; background-color: #f8d7da; border-color: #f5c6cb; font-weight: bold; border-left: 5px solid #dc3545; padding-left: 10px; }
.log-entry.complete { color: #155724; background-color: #d4edda; border-color: #c3e6cb; font-weight: bold; border-left: 5px solid #28a745; padding-left: 10px; }

/* Specific JSON Parse Warning Styling */
.log-entry.json-parse-warning { background-color: #fff3cd; border-color: #ffeeba; color: #856404; font-weight: normal; }
.log-entry.json-parse-warning .log-icon { color: #ffc107; }


/* Current Chat Analysis Output Area */
.current-analysis-output {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Message Boxes (Error/Success) */
.message-box {
  margin-top: 25px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  font-size: 1em;
}

.message-box.error {
  border: 1px solid #dc3545;
  background-color: #f8d7da;
  color: #721c24;
}

.message-box.success {
  border: 1px solid #28a745;
  background-color: #d4edda;
  color: #155724;
}

.message-title {
    font-size: 1.1em;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 10px;
}

.message-details {
    font-size: 0.9em;
    color: #495057;
    background-color: #e9ecef;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin-top: 10px;
}

.message-hint {
    font-size: 0.8em;
    color: #6c757d;
    margin-top: 10px;
}

.download-link {
    display: inline-block;
    margin-top: 15px;
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    transition: background-color 0.2s ease;
    font-weight: 600;
}

.download-link:hover {
    background-color: #218838;
}


.final-result-json {
    margin-top: 25px;
    padding: 20px;
    border: 1px solid #a0a0a0;
    border-radius: 8px;
    background-color: #f0f0f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}
.json-display { /* Style for <pre> tags displaying JSON */
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 300px;
    overflow-y: auto;
    font-size: 0.85em;
    padding: 10px;
    background-color: #e9ecef;
    border-radius: 4px;
    border: 1px solid #ced4da;
    color: #343a40;
}
</style>