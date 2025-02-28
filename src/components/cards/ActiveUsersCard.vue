<template>
  <el-card class="active-users-card !border-none" :class="{ loading }">
    <template #header>
      <div class="card-header">
        <span class="title">实时活跃用户</span>
        <div class="header-right">
          <el-tag size="small" type="success" effect="plain" class="update-time">
            最后更新: {{ lastUpdateTime }}
          </el-tag>
          <el-button :icon="RefreshRight" circle @click="handleRefresh" />
        </div>
      </div>
    </template>

    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-title">最近30分钟活跃用户</div>
        <div class="metric-value">{{ last30MinUsers || 0 }}</div>
      </div>
      <div class="metric-box">
        <div class="metric-title">最近5分钟活跃用户</div>
        <div class="metric-value">{{ last5MinUsers || 0 }}</div>
      </div>
    </div>

    <div class="trend-chart" ref="chartRef"></div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, watchEffect } from 'vue'
import { RefreshRight } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const props = defineProps({
  last30MinUsers: {
    type: Number,
    default: 0
  },
  last5MinUsers: {
    type: Number,
    default: 0
  },
  timeSeriesData: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  lastUpdateTime: {
    type: String,
    default: ''
  }
})

const emits = defineEmits(['refresh'])

const handleRefresh = () => {
  emits('refresh')
}

const chartRef = ref(null)
let chart = null

// 添加调试日志
watchEffect(() => {
  console.log('ActiveUsersCard props:', {
    last30MinUsers: props.last30MinUsers,
    last5MinUsers: props.last5MinUsers,
    timeSeriesData: props.timeSeriesData,
    loading: props.loading,
    lastUpdateTime: props.lastUpdateTime
  })
})

const updateChart = () => {
  if (!chartRef.value) return
  
  console.log('Updating chart with data:', props.timeSeriesData)
  
  try {
    if (!chart) {
      chart = echarts.init(chartRef.value)
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} 用户'
      },
      grid: {
        top: '10%',
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: props.timeSeriesData.map(item => item.time),
        axisLabel: {
          interval: 4
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1
      },
      series: [{
        name: '活跃用户',
        type: 'line',
        smooth: true,
        data: props.timeSeriesData.map(item => item.value),
        areaStyle: {
          opacity: 0.3
        },
        lineStyle: {
          width: 2
        },
        itemStyle: {
          borderWidth: 2
        }
      }]
    }

    console.log('Chart option:', option)
    chart.setOption(option)
  } catch (error) {
    console.error('Error updating chart:', error)
  }
}

watch(() => props.timeSeriesData, (newVal) => {
  console.log('timeSeriesData changed:', newVal)
  if (newVal && newVal.length > 0) {
    updateChart()
  }
}, { deep: true })

onMounted(() => {
  updateChart()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', () => {
    chart?.resize()
  })
})
</script>

<style lang="scss" scoped>
.active-users-card {
  transition: opacity 0.3s;

  &.loading {
    opacity: 0.6;
    pointer-events: none;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 16px;
    font-weight: 500;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .update-time {
      font-size: 12px;
    }
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-box {
  padding: 16px;
  border-radius: 8px;

  .metric-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
    opacity: 0.9;
  }

  .metric-value {
    font-size: 24px;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
}

.trend-chart {
  height: 300px;
  margin-top: 16px;
}
</style> 