<template>
  <div class="gsc-overview card-container">
    <div v-if="!overviewData?.length" class="no-data">
      Waiting for data...
    </div>
    
    <template v-else>
      <div class="metric-cards">
        <div class="metric-card clicks">
          <div class="metric-header">
            <el-tooltip
              content="点击次数表示用户从Google搜索结果页面点击进入您网站的次数"
              placement="top"
            >
              <div class="header-with-icon">
                <el-icon><Check /></el-icon>
                Total clicks
                <el-icon><QuestionFilled /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <div class="metric-value">{{ totalClicks }}</div>
        </div>
        <div class="metric-card impressions">
          <div class="metric-header">
            <el-tooltip
              content="展示次数表示您的网页在Google搜索结果中出现的次数"
              placement="top"
            >
              <div class="header-with-icon">
                <el-icon><Check /></el-icon>
                Total impressions
                <el-icon><QuestionFilled /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <div class="metric-value">{{ totalImpressions }}</div>
        </div>
        <div class="metric-card ctr">
          <div class="metric-header">
            <el-tooltip
              content="点击率(CTR)是点击次数除以展示次数的百分比"
              placement="top"
            >
              <div class="header-with-icon">
                <el-icon><Check /></el-icon>
                Average CTR
                <el-icon><QuestionFilled /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <div class="metric-value">{{ averageCtr }}</div>
        </div>
        <div class="metric-card position">
          <div class="metric-header">
            <el-tooltip
              content="平均排名表示您的网页在搜索结果中的平均位置"
              placement="top"
            >
              <div class="header-with-icon">
                <el-icon><Check /></el-icon>
                Average position
                <el-icon><QuestionFilled /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <div class="metric-value">{{ averagePosition }}</div>
        </div>
      </div>

      <div ref="chartRef" class="chart-container"></div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Check, QuestionFilled } from '@element-plus/icons-vue'

const props = defineProps({
  overviewData: {
    type: Array,
    required: true,
    default: () => []
  }
})

const chartRef = ref(null)
let chart = null

// 计算关键指标
const totalClicks = computed(() => {
  const total = props.overviewData.reduce((sum, item) => sum + Number(item.clicks), 0)
  return (total / 1000).toFixed(1) + 'K'
})

const totalImpressions = computed(() => {
  const total = props.overviewData.reduce((sum, item) => sum + Number(item.impressions), 0)
  return (total / 1000).toFixed(1) + 'K'
})

const averageCtr = computed(() => {
  const totalClicks = props.overviewData.reduce((sum, item) => sum + Number(item.clicks), 0)
  const totalImpressions = props.overviewData.reduce((sum, item) => sum + Number(item.impressions), 0)
  return Math.round((totalClicks / totalImpressions) * 100) + '%'
})

const averagePosition = computed(() => {
  if (!props.overviewData.length) return '0'
  const total = props.overviewData.reduce((sum, item) => sum + Number(item.position), 0)
  return Math.round(total / props.overviewData.length)
})

const initChart = () => {
  if (!chartRef.value || !props.overviewData?.length) return
  
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  
  // 判断是否为暗黑模式
  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#ffffff' : '#000000'
  const axisLineColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        const date = new Date(params[0].axisValue).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        })
        let result = `${date}<br/>`
        params.forEach(param => {
          let value = typeof param.value === 'number' ? param.value.toFixed(2) : param.value
          let color = param.color
          let marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`
          result += `${marker}${param.seriesName}: ${value}<br/>`
        })
        return result
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      backgroundColor: 'transparent'
    },
    legend: {
      data: ['Clicks', 'Impressions', 'CTR', 'Position'],
      top: 0,
      textStyle: {
        color: textColor
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.overviewData.map(item => item.date),
      axisLine: {
        lineStyle: {
          color: axisLineColor
        }
      },
      axisLabel: {
        color: textColor,
        fontSize: 12
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Clicks & Impressions',
        splitLine: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor,
          fontSize: 12
        },
        nameTextStyle: {
          color: textColor,
          fontSize: 12,
          padding: [0, 0, 0, 20]
        }
      },
      {
        type: 'value',
        name: 'CTR & Position',
        splitLine: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor,
          fontSize: 12,
          formatter: function(value) {
            return value.toFixed(2)
          }
        },
        nameTextStyle: {
          color: textColor,
          fontSize: 12,
          padding: [0, 20, 0, 0]
        }
      }
    ],
    series: [
      {
        name: 'Clicks',
        type: 'line',
        data: props.overviewData.map(item => item.clicks),
        smooth: true,
        itemStyle: { color: '#4CAF50' }
      },
      {
        name: 'Impressions',
        type: 'line',
        data: props.overviewData.map(item => item.impressions),
        smooth: true,
        itemStyle: { color: '#2196F3' }
      },
      {
        name: 'CTR',
        type: 'line',
        yAxisIndex: 1,
        data: props.overviewData.map(item => Number(item.ctr).toFixed(2)),
        smooth: true,
        itemStyle: { color: '#FF5722' }
      },
      {
        name: 'Position',
        type: 'line',
        yAxisIndex: 1,
        data: props.overviewData.map(item => Number(item.position).toFixed(2)),
        smooth: true,
        itemStyle: { color: '#9C27B0' }
      }
    ]
  }
  
  chart.setOption(option)
}

watch(() => props.overviewData, (newData) => {
  console.log('Overview data received:', newData)
  nextTick(() => {
    initChart()
  })
}, { deep: true })

// 监听主题变化
watch(
  () => document.documentElement.classList.contains('dark'),
  () => {
    nextTick(() => {
      chart?.dispose()
      chart = echarts.init(chartRef.value)
      initChart()
    })
  }
)

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    chart?.resize()
  })
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.gsc-overview {
  margin: 16px 0;
}

.card-container {
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-lighter);
  padding: 20px;
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.metric-card {
  padding: 16px;
  border-radius: 8px;
  color: white;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-with-icon {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  margin-bottom: 8px;
  cursor: help;
  opacity: 0.9;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.clicks { 
  background: linear-gradient(135deg, #4CAF50 0%, #43A047 100%);
}

.impressions { 
  background: linear-gradient(135deg, #2196F3 0%, #1E88E5 100%);
}

.ctr { 
  background: linear-gradient(135deg, #FF5722 0%, #F4511E 100%);
}

.position { 
  background: linear-gradient(135deg, #9C27B0 0%, #8E24AA 100%);
}

.chart-container {
  width: 100%;
  height: 400px;
  margin-top: 20px;
  background-color: transparent;
  border-radius: 8px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

:deep(.el-tooltip__trigger) {
  cursor: help;
  width: 100%;
}
</style>