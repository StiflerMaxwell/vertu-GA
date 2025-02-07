<template>
  <div class="core-metrics-grid">
    <el-card class="metric-card" v-for="(metric, index) in computedMetrics" :key="index">
      <template #header>
        <div class="card-header">
          <el-icon>
            <component :is="metric.icon" />
          </el-icon>
          <span>{{ metric.name }}</span>
        </div>
      </template>
      <div class="metric-value">
        {{ formatValue(metric.value, metric.type) }}
      </div>
      <div class="metric-trend" :class="metric.trend > 0 ? 'positive' : 'negative'" v-if="metric.trend !== null">
        {{ Math.abs(metric.trend) }}%
        <el-icon>
          <CaretTop v-if="metric.trend > 0" />
          <CaretBottom v-else />
        </el-icon>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  CaretTop,
  CaretBottom,
  User,
  View,
  Timer,
  Back
} from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  }
})

const formatValue = (value, type) => {
  if (!value && value !== 0) return '-'
  if (type === 'duration') {
    return `${(value / 60).toFixed(2)} 分钟`
  }
  if (type === 'percentage') {
    return `${(value * 100).toFixed(2)}%`
  }
  return value.toLocaleString()
}

const computedMetrics = computed(() => {
  if (!props.data || !props.data.length) {
    return defaultMetrics
  }

  try {
    const latest = props.data[props.data.length - 1]
    const previous = props.data[props.data.length - 2]

    if (!latest || !latest.metricValues) {
      return defaultMetrics
    }

    return [
      {
        name: '活跃用户',
        value: parseInt(latest.metricValues[0]?.value || 0),
        trend: previous?.metricValues ? calculateTrend(latest.metricValues[0]?.value, previous.metricValues[0]?.value) : null,
        icon: 'User',
        type: 'number'
      },
      {
        name: '页面浏览量',
        value: parseInt(latest.metricValues[1]?.value || 0),
        trend: previous?.metricValues ? calculateTrend(latest.metricValues[1]?.value, previous.metricValues[1]?.value) : null,
        icon: 'View',
        type: 'number'
      },
      {
        name: '平均会话时长',
        value: parseFloat(latest.metricValues[2]?.value || 0),
        trend: previous?.metricValues ? calculateTrend(latest.metricValues[2]?.value, previous.metricValues[2]?.value) : null,
        icon: 'Timer',
        type: 'duration'
      },
      {
        name: '跳出率',
        value: parseFloat(latest.metricValues[3]?.value || 0),
        trend: previous?.metricValues ? calculateTrend(latest.metricValues[3]?.value, previous.metricValues[3]?.value) : null,
        icon: 'Back',
        type: 'percentage'
      }
    ]
  } catch (error) {
    return defaultMetrics
  }
})

const defaultMetrics = [
  {
    name: '活跃用户',
    value: 0,
    trend: null,
    icon: 'User',
    type: 'number'
  },
  {
    name: '页面浏览量',
    value: 0,
    trend: null,
    icon: 'View',
    type: 'number'
  },
  {
    name: '平均会话时长',
    value: 0,
    trend: null,
    icon: 'Timer',
    type: 'duration'
  },
  {
    name: '跳出率',
    value: 0,
    trend: null,
    icon: 'Back',
    type: 'percentage'
  }
]

const calculateTrend = (current, previous) => {
  if (!current || !previous) return null
  const currentValue = parseFloat(current)
  const previousValue = parseFloat(previous)
  if (isNaN(currentValue) || isNaN(previousValue) || previousValue === 0) return null
  return parseFloat((((currentValue - previousValue) / previousValue) * 100).toFixed(2))
}
</script>

<style scoped>
.core-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  padding: 20px;
}

.metric-card {
  background: white;
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.positive {
  color: #00dc82;
}

.negative {
  color: #ff6b6b;
}
</style> 