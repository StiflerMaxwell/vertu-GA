<template>
  <div class="chart-container" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  }
})

const chartRef = ref(null)
let chart = null

const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart || !props.data || props.data.length === 0) {
    console.warn('图表或数据无效')
    return
  }

  console.log('TrendChart 收到的数据:', props.data)

  // 处理数据
  const dates = props.data.map(item => {
    const date = item.dimensionValues[0].value
    // 转换日期格式为 MM/DD
    const [year, month, day] = [
      date.substring(0, 4),
      date.substring(4, 6),
      date.substring(6, 8)
    ]
    return `${month}/${day}`
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
        data: props.data.map(item => Number(item.metricValues[0].value)),
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '页面浏览量',
        data: props.data.map(item => Number(item.metricValues[1].value)),
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '平均会话时长(分钟)',
        data: props.data.map(item => Number(item.metricValues[2].value) / 60),
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '跳出率(%)',
        data: props.data.map(item => Number(item.metricValues[3].value) * 100),
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

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

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