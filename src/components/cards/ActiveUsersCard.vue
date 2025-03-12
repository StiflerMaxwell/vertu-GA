<template>
  <el-card class="active-users-card !border-none">
    <template #header>
      <div class="card-header">
        <div class="header-left"></div>
        <span class="title">实时活跃用户</span>
        <div class="header-right">
          <el-tag size="small" type="success" effect="plain" class="update-time">
            最后更新: {{ lastUpdateTime }}
          </el-tag>
          <el-button :icon="RefreshRight" circle @click="handleRefresh" />
        </div>
      </div>
    </template>

    <div class="card-content">
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
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, watchEffect } from 'vue'
import { RefreshRight, Loading } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

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
  lastUpdateTime: {
    type: String,
    default: ''
  }
})

const emits = defineEmits(['refresh'])

const handleRefresh = async () => {
  try {
    const result = await emits('refresh')
    if (result?.error === 'QUOTA_EXCEEDED') {
      ElMessage.warning('API 配额已用完，将在 1 小时后恢复')
      // 调整下次刷新时间
      if (timer) {
        clearInterval(timer)
        // 1小时后重新开始定时刷新
        setTimeout(() => {
          timer = setInterval(() => {
            handleRefresh()
          }, REFRESH_INTERVAL)
        }, 3600000)
      }
    }
  } catch (error) {
    console.error('Refresh failed:', error)
  }
}

const chartRef = ref(null)
let chart = null

// 修改刷新间隔为 10 分钟
const REFRESH_INTERVAL = 600000 // 从 300000 改为 600000

// 添加调试日志
watchEffect(() => {
  console.log('ActiveUsersCard props:', {
    last30MinUsers: props.last30MinUsers,
    last5MinUsers: props.last5MinUsers,
    timeSeriesData: props.timeSeriesData,
    lastUpdateTime: props.lastUpdateTime
  })
})

const updateChart = () => {
  if (!chartRef.value) return
  
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
         
        axisLine: {
          show: false  // 隐藏 X 轴线
        },
        axisTick: {
          show: false  // 隐藏刻度线
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
         
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
  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    chart?.resize()
  })

  // 设置定时刷新
  const timer = setInterval(() => {
    handleRefresh() // 使用已定义的 handleRefresh 方法而不是 fetchData
  }, REFRESH_INTERVAL)

  onUnmounted(() => {
    clearInterval(timer)
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
  :deep(.el-card) {
    background-color: var(--bg-primary);
    border: none;
    
    .el-card__body {
      padding: 0;
      background-color: var(--bg-primary);
    }

    .el-card__header {
      padding: 12px 16px;
      background-color: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
    }
  }
}

.card-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;

  .title {
    @apply text-lg font-medium text-gray-900 dark:text-gray-100;
    text-align: center;
  }
}

.header-left {
  // 占位用，保持对称
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: end;
}

.update-time {
  margin-right: 8px;
}

.card-content {
  position: relative;
  min-height: 200px;
  padding: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.metric-box {
  padding: 16px;
  border-radius: 8px;
  background-color: var(--bg-secondary);
}

.metric-title {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.metric-value {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
}

.trend-chart {
  height: 300px;
  width: 100%;
}
</style> 