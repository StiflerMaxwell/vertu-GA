<template>
  <div class="chart-container" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ga4Client } from '../api/ga4'
import { ElMessage } from 'element-plus'

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

// 获取趋势数据
const fetchData = async () => {
  loading.value = true
  try {
    console.log('TrendChart fetching data for:', props.startDate, 'to', props.endDate)
    
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
    updateChart()
  } catch (error) {
    console.error('Error fetching trend data:', error)
    ElMessage.error('获取趋势数据失败')
  } finally {
    loading.value = false
  }
}

const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
}

const updateChart = () => {
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
        color: '#333'
      }
    },
    legend: {
      data: ['活跃用户', '页面浏览量', '平均会话时长(分钟)', '跳出率(%)'],
      textStyle: {
        color: '#666'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      },
      axisLabel: {
        color: '#666'
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
            color: '#999'
          }
        },
        axisLabel: {
          color: '#666'
        },
        nameTextStyle: {
          color: '#666'
        },
        splitLine: {
          show: false
        }
      },
      {
        type: 'value',
        name: '时长(分钟)',
        position: 'right',
        offset: 40,
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        },
        axisLabel: {
          color: '#666'
        },
        nameTextStyle: {
          color: '#666'
        },
        splitLine: {
          show: false
        }
      },
      {
        type: 'value',
        name: '跳出率(%)',
        position: 'right',
        offset: 80,
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        },
        axisLabel: {
          formatter: '{value}%',
          color: '#666'
        },
        nameTextStyle: {
          color: '#666'
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
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  }

  chart.setOption(option)
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

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
  window.removeEventListener('resize', () => {
    chart?.resize()
  })
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
}
</style>