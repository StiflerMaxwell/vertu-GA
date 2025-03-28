<template>
  <el-card class="performance-metrics">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <h3 class="title">性能指标</h3>
          <el-tag size="small" type="info">{{ url }}</el-tag>
        </div>
        <div class="header-actions">
          <el-button-group>
            <el-button 
              :type="selectedDevice === 'desktop' ? 'primary' : 'default'"
              @click="selectedDevice = 'desktop'"
            >
              <el-icon><Monitor /></el-icon>
              桌面端
            </el-button>
            <el-button 
              :type="selectedDevice === 'mobile' ? 'primary' : 'default'"
              @click="selectedDevice = 'mobile'"
            >
              <el-icon><Cellphone /></el-icon>
              移动端
            </el-button>
          </el-button-group>
          <el-button 
            type="info" 
            @click="showHistory = true"
          >
            <el-icon><Clock /></el-icon>
            历史记录
          </el-button>
          <el-button 
            type="primary" 
            :loading="testing"
            @click="runTest"
          >
            <el-icon><Refresh /></el-icon>
            开始测试
          </el-button>
        </div>
      </div>
    </template>

    <div class="metrics-content">
      <!-- 总体性能分数 -->
      <div class="score-section">
        <el-progress
          type="dashboard"
          :percentage="lighthouseData.performance || 0"
          :color="getScoreColor"
          :width="120"
          :stroke-width="10"
        >
          <template #default>
            <div class="score-value">
              <span class="number">{{ lighthouseData.performance || 0 }}</span>
              <span class="label">性能得分</span>
            </div>
          </template>
        </el-progress>
      </div>

      <!-- 详细指标 -->
      <div class="metrics-grid">
        <div 
          v-for="metric in metrics" 
          :key="metric.name"
          class="metric-item"
          :class="getScoreClass(metric.score)"
        >
          <div class="metric-header">
            <span class="metric-name">
              {{ metric.name }}
              <el-tooltip :content="metric.description" placement="top">
                <el-icon class="info-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </span>
            <el-tooltip 
              :content="`性能得分：${metric.score}分`" 
              placement="top"
            >
              <el-tag 
                :type="getScoreType(metric.score)"
                size="small"
                class="score-tag"
              >
                {{ metric.score }}分
              </el-tag>
            </el-tooltip>
          </div>
          <div class="metric-value">{{ metric.value }}</div>
        </div>
      </div>
    </div>

    <!-- 历史记录对话框 -->
    <el-dialog
      v-model="showHistory"
      title="历史记录查询"
      width="80%"
      class="history-dialog"
      append-to-body
    >
      <div class="history-table-wrapper">
        <el-table 
          v-loading="loading"
          :data="historyData" 
          style="width: 100%" 
          stripe
          border
          :header-cell-style="{
            background: 'var(--el-bg-color)',
            color: 'var(--el-text-color-primary)',
            fontWeight: '500'
          }"
        >
          <el-table-column prop="timestamp" label="测试时间" min-width="180" fixed>
            <template #default="{ row }">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="metrics.performance" label="性能得分" min-width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getScoreType(row.metrics.performance)">
                {{ row.metrics.performance }}分
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="device" label="设备类型" min-width="100" align="center">
            <template #default="{ row }">
              <el-tag type="info" size="small">
                {{ row.device === 'desktop' ? '桌面端' : '移动端' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="metrics.fcp" label="FCP" min-width="120" align="center" />
          <el-table-column prop="metrics.lcp" label="LCP" min-width="120" align="center" />
          <el-table-column prop="metrics.cls" label="CLS" min-width="120" align="center" />
          <el-table-column prop="metrics.tbt" label="TBT" min-width="120" align="center" />
          <el-table-column prop="ip" label="IP地址" min-width="140" align="center" />
          <el-table-column prop="screenSize" label="屏幕尺寸" min-width="120" align="center" />
        </el-table>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Monitor, Cellphone, Refresh, InfoFilled, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { runLighthouseTest } from '../api/lighthouse'
import { getLighthouseHistory, saveLighthouseResult } from '../api/lighthouseHistory'
import { performanceService } from '../firebase/performanceService'
import dayjs from 'dayjs'

const testing = ref(false)
const showHistory = ref(false)
const lighthouseData = ref({})
const historyData = ref([])
const selectedDevice = ref('desktop')
const url = ref('https://vertu.com')  // 或者从 props 传入
const loading = ref(false)

// 获取分数对应的颜色
const getScoreColor = (percentage) => {
  if (percentage >= 90) return '#67C23A'
  if (percentage >= 50) return '#E6A23C'
  return '#F56C6C'
}

// 获取分数对应的类名
const getScoreClass = (score) => {
  if (score >= 90) return 'good'
  if (score >= 50) return 'average'
  return 'poor'
}

// 获取标签类型
const getScoreType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 加载最新的性能数据
const loadLatestMetrics = async () => {
  try {
    console.log('尝试加载最新性能指标...')
    const history = await performanceService.getPerformanceHistory(1) // 只获取最新的一条
    if (history.length > 0) {
      const latest = history[0]
      lighthouseData.value = {
        performance: latest.metrics.performance,
        fcp: latest.metrics.fcp,
        fcp_score: latest.metrics.fcp_score,
        lcp: latest.metrics.lcp,
        lcp_score: latest.metrics.lcp_score,
        cls: latest.metrics.cls,
        cls_score: latest.metrics.cls_score,
        tbt: latest.metrics.tbt,
        tbt_score: latest.metrics.tbt_score
      }
      console.log('成功加载最新性能指标')
    } else {
      console.log('没有找到历史性能数据')
    }
  } catch (error) {
    console.error('加载最新性能指标失败:', error)
    console.error('错误代码:', error.code)
    console.error('错误信息:', error.message)
    
    if (error.code === 'permission-denied') {
      ElMessage.error('权限错误: 无法读取性能数据。请检查 Firestore 规则设置。')
    } else if (error.code === 'unavailable') {
      ElMessage.error('服务不可用: 请检查网络连接')
    } else {
      ElMessage.error('加载性能数据失败: ' + error.message)
    }
  }
}

// 加载历史数据
const loadHistoryData = async () => {
  loading.value = true
  try {
    console.log('加载性能历史数据...')
    historyData.value = await performanceService.getPerformanceHistory()
    console.log(`成功加载了 ${historyData.value.length} 条历史记录`)
  } catch (error) {
    console.error('加载历史数据失败:', error)
    console.error('错误代码:', error.code)
    console.error('错误信息:', error.message)
    
    if (error.code === 'permission-denied') {
      ElMessage.error('权限错误: 无法读取历史数据。请检查 Firestore 规则设置。')
    } else if (error.code === 'unavailable') {
      ElMessage.error('服务不可用: 请检查网络连接')
    } else {
      ElMessage.error('加载历史数据失败: ' + error.message)
    }
  } finally {
    loading.value = false
  }
}

// 运行测试
const runTest = async () => {
  if (testing.value) return
  testing.value = true
  
  try {
    console.log('开始执行性能测试...')
    const result = await runLighthouseTest(url.value, {
      device: selectedDevice.value
    })
    
    // 记录到数据库
    try {
      console.log('正在保存性能测试结果到数据库...')
      await performanceService.logPerformanceMetrics(result, url.value)
      console.log('性能测试结果已保存到数据库')
    } catch (dbError) {
      console.error('保存到数据库失败:', dbError)
      console.error('错误代码:', dbError.code)
      console.error('错误信息:', dbError.message)
      
      ElMessage.warning('测试完成，但无法保存到数据库: ' + dbError.message)
    }
    
    // 更新当前显示的数据
    lighthouseData.value = result
    
    // 重新加载历史数据
    await loadHistoryData()
    
    ElMessage.success('性能测试完成')
  } catch (error) {
    console.error('性能测试失败:', error)
    ElMessage.error('性能测试失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

// 计算指标数据
const metrics = computed(() => [
  {
    name: '首次内容绘制 (FCP)',
    value: lighthouseData.value.fcp || '-',
    score: lighthouseData.value.fcp_score || 0,
    description: '页面从开始加载到任何部分的内容在屏幕上完成渲染的时间'
  },
  {
    name: '最大内容绘制 (LCP)',
    value: lighthouseData.value.lcp || '-',
    score: lighthouseData.value.lcp_score || 0,
    description: '页面从开始加载到最大的文本块或图片元素在屏幕上完成渲染的时间'
  },
  {
    name: '累积布局偏移 (CLS)',
    value: lighthouseData.value.cls || '-',
    score: lighthouseData.value.cls_score || 0,
    description: '页面加载期间，视口中的可见元素移动的程度总和'
  },
  {
    name: '总阻塞时间 (TBT)',
    value: lighthouseData.value.tbt || '-',
    score: lighthouseData.value.tbt_score || 0,
    description: '主线程被阻塞时间超过50ms的总时间'
  }
])

// 监听对话框打开
watch(showHistory, async (newVal) => {
  if (newVal) {
    await loadHistoryData()
  }
})

// 初始化
onMounted(() => {
  loadLatestMetrics()
})
</script>

<style scoped>
/* 基础样式 */
.performance-metrics {
  height: 100%;
  background: var(--el-bg-color);
  transition: all 0.3s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.metrics-content {
  padding: 20px 0;
}

.score-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.score-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-value .number {
  font-size: 24px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.score-value .label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.metric-item {
  padding: 16px;
  border-radius: 4px;
  background: var(--el-bg-color-overlay);
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.metric-item.good { 
  border-left-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.metric-item.average { 
  border-left-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.metric-item.poor { 
  border-left-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.info-icon {
  font-size: 14px;
  cursor: help;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.info-icon:hover {
  opacity: 1;
}

.metric-value {
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 500;
}

/* 移除 :deep(.dark) 嵌套，直接使用 .dark 选择器 */
.dark .performance-metrics {
  background: var(--el-bg-color);
}

.dark .metric-item {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
}

.dark .metric-item.good {
  background: rgba(64, 158, 255, 0.15);
  border-color: var(--el-color-success);
}

.dark .metric-item.average {
  background: rgba(230, 162, 60, 0.15);
  border-color: var(--el-color-warning);
}

.dark .metric-item.poor {
  background: rgba(245, 108, 108, 0.15);
  border-color: var(--el-color-danger);
}

.dark .metric-name,
.dark .metric-value,
.dark .score-value .number {
  color: #fff;
}

.dark .info-icon,
.dark .score-value .label {
  color: #909399;
}

/* Element Plus 组件的暗黑模式适配 */
.dark :deep(.el-tag) {
  background-color: var(--el-bg-color);
  border-color: var(--el-border-color-light);
  color: #fff;
}

.dark :deep(.el-button-group .el-button:not(.el-button--primary)) {
  background: var(--el-bg-color);
  border-color: var(--el-border-color-light);
  color: #fff;
}

.dark :deep(.el-button-group .el-button:not(.el-button--primary)):hover {
  background: var(--el-color-primary);
  color: #fff;
}

.dark :deep(.el-progress__text) {
  color: #fff !important;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .el-dialog {
    width: 95% !important;
  }
}

.score-tag {
  min-width: 45px;
  text-align: center;
}

/* 历史记录对话框样式 */
.history-dialog {
  --el-dialog-padding-primary: 20px;
}

:deep(.el-dialog) {
  margin: 0 auto;
  margin-top: 15vh;
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

:deep(.el-dialog__headerbtn) {
  top: 20px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

.history-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-light);
  --el-table-header-bg-color: var(--el-bg-color);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
}

/* 暗黑模式适配 */
.dark {
  :deep(.el-dialog) {
    background: var(--el-bg-color);
  }

  :deep(.el-table) {
    background-color: var(--el-bg-color);
    color: #fff;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    background-color: var(--el-bg-color);
    border-bottom-color: var(--el-border-color-light);
    color: #fff;
  }

  :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
    background: var(--el-bg-color-overlay);
    color: #fff;
  }

  :deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
    background-color: var(--el-color-primary-dark-2) !important;
    color: #fff !important;
  }

  :deep(.el-table__body tr:hover > td) {
    background-color: var(--el-color-primary-dark-2) !important;
    color: #fff !important;
  }
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin-top: 10vh;
  }

  :deep(.el-dialog__body) {
    padding: 15px;
  }

  .history-table-wrapper {
    margin: 0 -15px;
  }
}
</style> 