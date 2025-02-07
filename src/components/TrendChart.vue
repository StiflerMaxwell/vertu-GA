<template>
  <div class="chart-container" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true
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
  if (!chart || !props.data) return

  const options = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['活跃用户', '页面浏览量', '平均会话时长', '跳出率'],
      textStyle: {
        color: '#ffffff'
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map(item => item.date),
      axisLabel: {
        color: '#ffffff'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '用户/浏览量',
        axisLabel: {
          color: '#ffffff'
        }
      },
      {
        type: 'value',
        name: '时长/跳出率',
        axisLabel: {
          color: '#ffffff',
          formatter: '{value} %'
        }
      }
    ],
    series: [
      {
        name: '活跃用户',
        type: 'line',
        data: props.data.map(item => item.activeUsers),
        smooth: true
      },
      {
        name: '页面浏览量',
        type: 'line',
        data: props.data.map(item => item.screenPageViews),
        smooth: true
      },
      {
        name: '平均会话时长',
        type: 'line',
        yAxisIndex: 1,
        data: props.data.map(item => item.averageSessionDuration),
        smooth: true
      },
      {
        name: '跳出率',
        type: 'line',
        yAxisIndex: 1,
        data: props.data.map(item => item.bounceRate * 100), // 转换为百分比
        smooth: true
      }
    ],
    color: ['#00dc82', '#54a0ff', '#ff9f43', '#ff6b6b']
  }

  chart.setOption(options)
}

watch(() => props.data, updateChart, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', () => chart?.resize())
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
}
</style>