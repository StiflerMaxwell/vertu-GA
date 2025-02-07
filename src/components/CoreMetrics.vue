<template>
  <div class="core-metrics">
    <div class="metrics-grid">
      <!-- 用户数指标卡片 -->
      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon" style="background: rgba(64, 158, 255, 0.1);">
            <el-icon style="color: #409EFF;"><User /></el-icon>
          </div>
          <div class="metric-title-wrapper">
            <h3 class="metric-title">活跃用户</h3>
            <span class="metric-subtitle">Total Users</span>
          </div>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ formatNumber(activeUsers) }}</div>
          <div class="metric-trend" :class="usersTrend.type">
            <el-icon>
              <component :is="usersTrend.type === 'increase' ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
            <span>{{ usersTrend.value }}%</span>
          </div>
        </div>
      </div>

      <!-- 页面浏览指标卡片 -->
      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon" style="background: rgba(103, 194, 58, 0.1);">
            <el-icon style="color: #67C23A;"><View /></el-icon>
          </div>
          <div class="metric-title-wrapper">
            <h3 class="metric-title">页面浏览</h3>
            <span class="metric-subtitle">Page Views</span>
          </div>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ formatNumber(pageViews) }}</div>
          <div class="metric-trend" :class="pageViewsTrend.type">
            <el-icon>
              <component :is="pageViewsTrend.type === 'increase' ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
            <span>{{ pageViewsTrend.value }}%</span>
          </div>
        </div>
      </div>

      <!-- 会话时长指标卡片 -->
      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon" style="background: rgba(230, 162, 60, 0.1);">
            <el-icon style="color: #E6A23C;"><Timer /></el-icon>
          </div>
          <div class="metric-title-wrapper">
            <h3 class="metric-title">平均会话时长</h3>
            <span class="metric-subtitle">Avg. Duration</span>
          </div>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ formatDuration(sessionDuration) }}</div>
          <div class="metric-trend" :class="durationTrend.type">
            <el-icon>
              <component :is="durationTrend.type === 'increase' ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
            <span>{{ durationTrend.value }}%</span>
          </div>
        </div>
      </div>

      <!-- 跳出率指标卡片 -->
      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon" style="background: rgba(245, 108, 108, 0.1);">
            <el-icon style="color: #F56C6C;"><Share /></el-icon>
          </div>
          <div class="metric-title-wrapper">
            <h3 class="metric-title">跳出率</h3>
            <span class="metric-subtitle">Bounce Rate</span>
          </div>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ formatPercentage(bounceRate) }}</div>
          <div class="metric-trend" :class="bounceTrend.type">
            <el-icon>
              <component :is="bounceTrend.type === 'increase' ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
            <span>{{ bounceTrend.value }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { User, View, Timer, Share } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  }
})

// 添加数据检查
onMounted(() => {
  console.log('CoreMetrics mounted, props data:', props.data)
  if (props.data && props.data.length > 0) {
    console.log('Last metric:', props.data[props.data.length - 1])
    console.log('Metric values:', props.data[props.data.length - 1]?.metricValues)
  }
})

// 格式化函数
const formatNumber = (value) => {
  console.log('formatNumber input:', value) // 调试日志
  if (!value && value !== 0) return '0'
  const num = Number(value)
  if (isNaN(num)) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

const formatDuration = (seconds) => {
  console.log('formatDuration input:', seconds) // 调试日志
  if (!seconds && seconds !== 0) return '0分0秒'
  const s = Number(seconds)
  if (isNaN(s)) return '0分0秒'
  const minutes = Math.floor(s / 60)
  const remainingSeconds = Math.floor(s % 60)
  return `${minutes}分${remainingSeconds}秒`
}

const formatPercentage = (value) => {
  console.log('formatPercentage input:', value) // 调试日志
  if (!value && value !== 0) return '0%'
  const v = Number(value)
  if (isNaN(v)) return '0%'
  return v.toFixed(1) + '%'
}

// 获取当前和历史数据
const currentData = computed(() => props.data[props.data.length - 1]?.metricValues || [])
const previousData = computed(() => props.data[props.data.length - 2]?.metricValues || [])

// 计算属性
const activeUsers = computed(() => currentData.value[0]?.value || 0)
const pageViews = computed(() => currentData.value[1]?.value || 0)
const sessionDuration = computed(() => currentData.value[2]?.value || 0)
const bounceRate = computed(() => currentData.value[3]?.value || 0)

// 计算趋势
const calculateTrend = (currentIndex) => {
  const currentValue = currentData.value[currentIndex]?.value
  const previousValue = previousData.value[currentIndex]?.value

  if (!previousValue || previousValue === 0) return { type: 'increase', value: '0.0' }
  
  const current = Number(currentValue)
  const previous = Number(previousValue)
  
  if (isNaN(current) || isNaN(previous)) return { type: 'increase', value: '0.0' }
  
  const change = ((current - previous) / previous) * 100
  return {
    type: change >= 0 ? 'increase' : 'decrease',
    value: Math.abs(change).toFixed(1)
  }
}

// 趋势计算
const usersTrend = computed(() => calculateTrend(0))
const pageViewsTrend = computed(() => calculateTrend(1))
const durationTrend = computed(() => calculateTrend(2))
const bounceTrend = computed(() => {
  const trend = calculateTrend(3)
  return {
    type: trend.type === 'increase' ? 'decrease' : 'increase',
    value: trend.value
  }
})

onMounted(() => {
  console.log('Current metrics:', currentData.value)
  console.log('Previous metrics:', previousData.value)
})
</script>

<style scoped>
.core-metrics {
  padding: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.metric-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
}

.metric-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  letter-spacing: 0.5px;
}

.metric-subtitle {
  font-size: 12px;
  color: #666666;
  font-weight: 400;
}

.metric-content {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.5px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
}

.metric-trend.increase {
  color: #67C23A;
  background: rgba(103, 194, 58, 0.1);
}

.metric-trend.decrease {
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.1);
}

/* 为每个卡片添加不同的强调色 */
.metric-card:nth-child(1) .metric-value {
  color: #409EFF;
}

.metric-card:nth-child(2) .metric-value {
  color: #67C23A;
}

.metric-card:nth-child(3) .metric-value {
  color: #E6A23C;
}

.metric-card:nth-child(4) .metric-value {
  color: #F56C6C;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1400px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .metric-value {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    padding: 20px;
  }

  .metric-title {
    font-size: 14px;
  }

  .metric-value {
    font-size: 22px;
  }
}
</style> 