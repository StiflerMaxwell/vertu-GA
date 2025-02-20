<template>
  <div class="core-metrics">
    <div class="metrics-container" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(metric, index) in metrics" :key="index">
          <el-card class="metric-card" :class="metric.type">
            <div class="metric-content">
              <div class="metric-header">
                <span class="metric-title">{{ metric.title }}</span>
                <el-tooltip :content="metric.tooltip" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <div class="metric-value">{{ formatValue(metric.value, metric.type) }}</div>
              <div class="metric-trend" :class="getTrendClass(metric.trend)">
                {{ formatTrend(metric.trend) }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { QuestionFilled, List } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ga4Client } from '../api/ga4'
import { runLighthouseTest } from '../api/lighthouse'
import { getLighthouseHistory, saveLighthouseResult } from '../api/lighthouseHistory'

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  }
})

const loading = ref(false)
const metrics = ref([
  {
    title: '访问量',
    type: 'visits',
    value: 0,
    trend: 0,
    tooltip: '时间范围内的总访问量',
    metricName: 'screenPageViews'
  },
  {
    title: '访客数',
    type: 'users',
    value: 0,
    trend: 0,
    tooltip: '时间范围内的独立访客数',
    metricName: 'activeUsers'
  },
  {
    title: '跳出率',
    type: 'bounce',
    value: 0,
    trend: 0,
    tooltip: '只浏览一个页面就离开的访问占比',
    metricName: 'bounceRate'
  },
  {
    title: '平均访问时长',
    type: 'duration',
    value: 0,
    trend: 0,
    tooltip: '访客平均停留时间',
    metricName: 'averageSessionDuration'
  }
])

const lighthouseData = ref({
  performance: 0,
  accessibility: 0,
  bestPractices: 0,
  seo: 0,
  fcp: '-',
  lcp: '-',
  cls: '-',
  timestamp: ''
})

const testing = ref(false)
const showHistory = ref(false)
const historyData = ref([])

// 检查日期是否有效
const isValidDate = (dateStr) => {
  if (!dateStr) return false
  if (typeof dateStr !== 'string') return false
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return false
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date)
}

// 获取数据
const fetchData = async () => {
  if (!isValidDate(props.startDate) || !isValidDate(props.endDate)) {
    console.log('CoreMetrics: Waiting for valid dates...')
    return
  }

  loading.value = true
  try {
    console.log('CoreMetrics fetching data for:', props.startDate, 'to', props.endDate)

    // 计算上一时间段
    const currentStartDate = new Date(props.startDate)
    const currentEndDate = new Date(props.endDate)
    const daysDiff = Math.floor((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24))
    
    const previousStartDate = new Date(currentStartDate)
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff)
    const previousEndDate = new Date(currentEndDate)
    previousEndDate.setDate(previousEndDate.getDate() - daysDiff)

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // 获取当前和上期数据
    const [currentResponse, previousResponse] = await Promise.all([
      ga4Client.runReport({
        dateRanges: [{ 
          startDate: props.startDate, 
          endDate: props.endDate 
        }],
        metrics: metrics.value.map(m => ({ name: m.metricName }))
      }),
      ga4Client.runReport({
        dateRanges: [{ 
          startDate: formatDate(previousStartDate), 
          endDate: formatDate(previousEndDate) 
        }],
        metrics: metrics.value.map(m => ({ name: m.metricName }))
      })
    ])

    console.log('CoreMetrics API responses:', { current: currentResponse, previous: previousResponse })

    // 处理数据
    const current = currentResponse.rows[0]
    const previous = previousResponse.rows[0]

    // 更新指标数据
    metrics.value = metrics.value.map((metric, index) => {
      const currentValue = parseFloat(current.metricValues[index].value)
      const previousValue = parseFloat(previous.metricValues[index].value)
      const trend = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0

      return {
        ...metric,
        value: currentValue,
        trend: trend
      }
    })

    console.log('CoreMetrics processed data:', metrics.value)

  } catch (error) {
    console.error('Error fetching core metrics:', error)
    ElMessage.error('获取核心指标失败')
  } finally {
    loading.value = false
  }
}

// 格式化数值
const formatValue = (value, type) => {
  if (type === 'bounce') {
    return `${(value * 100).toFixed(1)}%`
  }
  if (type === 'duration') {
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes}分${seconds}秒`
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return value.toLocaleString()
}

// 格式化趋势
const formatTrend = (value) => {
  if (!value && value !== 0) return '--'
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

// 获取趋势样式
const getTrendClass = (value) => {
  if (!value) return ''
  return value > 0 ? 'trend-up' : 'trend-down'
}

// 监听日期变化
watch(
  [() => props.startDate, () => props.endDate],
  ([newStart, newEnd], [oldStart, oldEnd]) => {
    console.log('CoreMetrics dates changed:', {
      newStart,
      newEnd,
      oldStart,
      oldEnd
    })
    
    if (isValidDate(newStart) && isValidDate(newEnd)) {
      console.log('CoreMetrics valid dates detected, fetching data...')
      fetchData()
    } else {
      console.log('CoreMetrics invalid or empty dates, skipping fetch')
    }
  },
  { immediate: true }
)

// 加载历史记录
const loadHistory = () => {
  historyData.value = getLighthouseHistory()
  if (historyData.value.length > 0) {
    lighthouseData.value = historyData.value[0] // 使用最新的记录
  }
}

const runTest = async () => {
  testing.value = true
  try {
    const result = await runLighthouseTest('https://www.vertu.com')
    lighthouseData.value = result
    historyData.value = saveLighthouseResult(result)
    ElMessage.success('性能测试完成')
  } catch (error) {
    ElMessage.error('性能测试失败')
  } finally {
    testing.value = false
  }
}

const getScoreColor = (percentage) => {
  if (percentage >= 90) return '#67C23A'
  if (percentage >= 50) return '#E6A23C'
  return '#F56C6C'
}

const getScoreType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 50) return 'warning'
  return 'danger'
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

const lastTestTime = computed(() => {
  if (!lighthouseData.value.timestamp) return '暂无测试记录'
  return `最近测试: ${formatTime(lighthouseData.value.timestamp)}`
})

onMounted(() => {
  fetchData()
  loadHistory() // 加载历史记录而不是立即运行测试
})
</script>

<style scoped>
.metrics-container {
  margin-bottom: 24px;
}

.metric-card {
  height: 120px;
  border-radius: 12px;
  transition: all 0.3s;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.metric-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.metric-title {
  font-size: 14px;
  color: var(--text-secondary);
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin: 8px 0;
}

.metric-trend {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.trend-up {
  color: var(--success-color);
  background: var(--success-light);
}

.trend-down {
  color: var(--danger-color);
  background: var(--danger-light);
}

:deep(.el-card) {
  --el-card-bg-color: var(--card-bg);
  --el-card-border-color: var(--border-color);
  box-shadow: none !important;
}

:deep(.el-card__body) {
  padding: 16px;
}

@media (max-width: 768px) {
  .el-col {
    width: 100%;
    margin-bottom: 16px;
  }
}

.performance-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  transition: all 0.3s;
  height: 240px;
}

.performance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

.test-time {
  font-size: 13px;
  color: var(--text-secondary);
}

.performance-metrics {
  display: flex;
  gap: 32px;
  padding: 24px 0;
  height: calc(100% - 60px);
}

.performance-score {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.progress-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
}

.progress-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.metrics-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 0;
}

.performance-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-top: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item .label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.detail-item .value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

.test-button {
  align-self: flex-end;
  margin-top: 16px;
}

/* 暗色主题适配 */
.dark .performance-card {
  background: var(--dark-card-bg);
  border-color: var(--dark-border-color);
}

.dark .title-text {
  color: var(--dark-text-color);
}

.dark .test-time,
.dark .progress-label,
.dark .detail-item .label {
  color: var(--dark-text-secondary);
}

.dark .progress-value,
.dark .detail-item .value {
  color: var(--dark-text-color);
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}
</style> 