<template>
  <div class="chart-container" ref="chartRef" v-chart-resize="chart" :class="{'loading': loading && !chartData.length}">
    <div v-if="loading && !chartData.length" class="loading-text">
      数据加载中...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, onBeforeMount, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { ga4Client } from '../api/ga4'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'

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

const chartRef = ref(null)
const loading = ref(false)
const chartData = ref([])
let chart = null
let resizeTimer = null

// 响应式设计 - 屏幕宽度监听
const screenWidth = ref(window.innerWidth)

// 获取趋势数据
const fetchData = async () => {
  loading.value = true;
  try {
    console.log('TrendChart fetching data for:', props.startDate, 'to', props.endDate)
    
    if (!props.startDate || !props.endDate) {
      console.warn('日期范围无效，无法获取数据');
      loading.value = false;
      return;
    }
    
    const report = {
      dateRanges: [{ 
        startDate: props.startDate, 
        endDate: props.endDate 
      }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      orderBys: [
        {
          dimension: { dimensionName: 'date' },
          desc: false
        }
      ]
    }

    const response = await ga4Client.runReport(report)
    console.log('TrendChart API response:', response)
    chartData.value = response.rows || []
    nextTick(() => {
      updateChart()
    })
  } catch (error) {
    console.error('Error fetching trend data:', error)
    ElMessage.error('获取趋势数据失败')
  } finally {
    // 这里不要设置loading.value = false，让updateChart来处理
    // 避免在图表渲染前就取消loading状态
  }
}

const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  
  // 监听全局 resize 事件，适用于折叠/展开区块
  window.addEventListener('resize', handleResize)
}

// 防抖处理函数确保不会过于频繁地调用 resize
const handleResize = () => {
  screenWidth.value = window.innerWidth
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (chart) {
      console.log('TrendChart resize 被触发')
      chart.resize()
    }
  }, 300)
}

// 添加一个公共方法用于手动触发图表重绘
const forceResize = () => {
  if (!chart) return;
  
  nextTick(() => {
    if (chart) {
      console.log('TrendChart forceResize 被触发')
      chart.resize()
    }
  })
}

// 监听来自父组件的折叠/展开事件
const setupEventListeners = () => {
  window.addEventListener('collapseChange', forceResize)
  window.addEventListener('resize', handleResize)
}

const cleanupEventListeners = () => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('collapseChange', forceResize)
  
  if (resizeTimer) {
    clearTimeout(resizeTimer)
    resizeTimer = null
  }
}

const updateChart = () => {
  if (!chartRef.value) {
    console.warn('图表容器不存在')
    return
  }
  
  if (!chart && chartRef.value) {
    chart = echarts.init(chartRef.value)
  }
  
  if (!chart || !chartData.value.length) {
    console.warn('图表或数据无效')
    return
  }

  // 处理数据
  const dates = chartData.value.map(item => {
    const date = item.dimensionValues[0].value
    // 转换日期格式为 MM/DD
    return `${date.substring(4, 6)}/${date.substring(6, 8)}`
  })

  const isMobile = screenWidth.value <= 768
  const isSmallMobile = screenWidth.value <= 480
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          let value = param.value
          if (param.seriesName === '平均会话时长(分钟)') {
            value = value.toFixed(2) + ' 分钟'
          } else if (param.seriesName === '跳出率(%)') {
            value = value.toFixed(2) + '%'
          }
          result += `${param.marker}${param.seriesName}: ${value}<br/>`
        })
        return result
      },
      textStyle: {
        color: '#333',
        fontSize: isSmallMobile ? 10 : (isMobile ? 11 : 12)
      }
    },
    legend: {
      data: ['活跃用户', '页面浏览量', '平均会话时长(分钟)', '跳出率(%)'],
      textStyle: {
        color: '#666',
        fontSize: isSmallMobile ? 10 : (isMobile ? 11 : 12)
      },
      itemWidth: isSmallMobile ? 12 : 15,
      itemHeight: isSmallMobile ? 8 : 10,
      itemGap: isSmallMobile ? 5 : 10
    },
    grid: {
      left: isMobile ? '3%' : '3%',
      right: isMobile ? '8%' : '4%',
      bottom: isMobile ? '10%' : '8%',
      top: isMobile ? '20%' : '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#999',
          width: isSmallMobile ? 0.5 : 1
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: isSmallMobile ? 9 : (isMobile ? 10 : 12),
        interval: isMobile ? 'auto' : 0,
        rotate: isMobile ? 30 : 0
      },
      splitLine: {
        show: false
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '用户/浏览量',
        position: 'left',
        axisLine: {
          lineStyle: {
            color: '#999',
            width: isSmallMobile ? 0.5 : 1
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: isSmallMobile ? 9 : (isMobile ? 10 : 12)
        },
        nameTextStyle: {
          color: '#666',
          fontSize: isSmallMobile ? 9 : (isMobile ? 10 : 12),
          padding: isMobile ? [0, 0, 0, 0] : [0, 0, 10, 0]
        },
        splitLine: {
          show: false
        }
      },
      {
        type: 'value',
        name: '时长(分钟)',
        position: 'right',
        offset: isMobile ? 30 : 40,
        axisLine: {
          lineStyle: {
            color: '#999',
            width: isSmallMobile ? 0.5 : 1
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: isSmallMobile ? 9 : (isMobile ? 10 : 12)
        },
        nameTextStyle: {
          color: '#666',
          fontSize: isSmallMobile ? 9 : (isMobile ? 10 : 12),
          padding: isMobile ? [0, 0, 0, 0] : [0, 0, 10, 0]
        },
        splitLine: {
          show: false
        }
      },
      {
        type: 'value',
        name: '跳出率(%)',
        position: 'right',
        offset: isMobile ? 0 : 80,
        axisLine: {
          lineStyle: {
            color: '#999',
            width: isSmallMobile ? 0.5 : 1
          }
        },
        axisLabel: {
          formatter: '{value}%',
          color: '#666',
          fontSize: isSmallMobile ? 9 : (isMobile ? 10 : 12),
          show: !isMobile
        },
        nameTextStyle: {
          color: '#666',
          fontSize: isSmallMobile ? 9 : (isMobile ? 10 : 12),
          padding: isMobile ? [0, 0, 0, 0] : [0, 0, 10, 0],
          show: !isMobile
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '活跃用户',
        data: chartData.value.map(item => Number(item.metricValues[0].value)),
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        symbol: isMobile ? 'none' : 'emptyCircle',
        symbolSize: isSmallMobile ? 3 : 4,
        lineStyle: {
          width: isSmallMobile ? 1.5 : 2
        },
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '页面浏览量',
        data: chartData.value.map(item => Number(item.metricValues[1].value)),
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        symbol: isMobile ? 'none' : 'emptyCircle',
        symbolSize: isSmallMobile ? 3 : 4,
        lineStyle: {
          width: isSmallMobile ? 1.5 : 2
        },
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '平均会话时长(分钟)',
        data: chartData.value.map(item => Number(item.metricValues[2].value) / 60),
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        symbol: isMobile ? 'none' : 'emptyCircle',
        symbolSize: isSmallMobile ? 3 : 4,
        lineStyle: {
          width: isSmallMobile ? 1.5 : 2
        },
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '跳出率(%)',
        data: chartData.value.map(item => Number(item.metricValues[3].value) * 100),
        type: 'line',
        smooth: true,
        yAxisIndex: 2,
        symbol: isMobile ? 'none' : 'emptyCircle',
        symbolSize: isSmallMobile ? 3 : 4,
        lineStyle: {
          width: isSmallMobile ? 1.5 : 2
        },
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  }

  chart.setOption(option)
  // 确保图表初始化后立即调整大小
  setTimeout(() => {
    if (chart) {
      chart.resize()
      // 确保加载状态结束
      loading.value = false
    }
  }, 100)
}

// 监听日期变化
watch(
  [() => props.startDate, () => props.endDate],
  ([newStart, newEnd], [oldStart, oldEnd]) => {
    console.log('TrendChart dates changed:', {
      newStart,
      newEnd,
      oldStart,
      oldEnd
    })
    
    if (newStart && newEnd) {
      fetchData()
    }
  },
  { immediate: true }
)

// 在视图更新后，确保图表大小正确
watch(() => chartData.value, () => {
  nextTick(() => {
    if (chart) chart.resize()
  })
})

onMounted(() => {
  nextTick(() => {
    initChart()
    // 确保组件挂载后，监听全局折叠事件
    setupEventListeners()
    
    // 如果已有数据则立即更新图表
    if (chartData.value.length > 0) {
      updateChart()
    } else {
      // 否则获取数据
      fetchData()
    }
    handleResize()
  })
})

onBeforeUnmount(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  // 移除全局事件监听
  cleanupEventListeners()
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
  position: relative;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  overflow: hidden;
}

/* 移除蒙层，避免交互问题 */
/* .chart-container::after {
  content: '';
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  z-index: 1;
  pointer-events: none;
}

.chart-container.loading::after {
  display: block;
} */

.loading-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 14px;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 8px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .chart-container {
    height: 240px;
  }
  
  .trend-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .trend-title {
    font-size: 14px;
    margin-bottom: 5px;
  }
  
  .trend-controls {
    width: 100%;
    justify-content: space-between;
    gap: 6px;
  }
}

/* 小屏幕设备优化 */
@media screen and (max-width: 480px) {
  .chart-container {
    height: 180px;
  }
  
  .trend-controls .el-button {
    padding: 4px 8px;
    font-size: 11px;
    min-width: 60px;
  }
}
</style>