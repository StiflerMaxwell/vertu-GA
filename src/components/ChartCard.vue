<template>
  <el-card class="chart-card">
    <template #header>
      <div class="card-header">
        <span>{{ title }}</span>
        <el-select v-model="timeRange" size="small" @change="handleRangeChange">
          <el-option label="近7天" value="7" />
          <el-option label="近30天" value="30" />
          <el-option label="近90天" value="90" />
        </el-select>
      </div>
    </template>
    <div ref="chartRef" class="chart-container"></div>
  </el-card>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

export default {
  name: 'ChartCard',
  props: {
    title: String,
    data: Array
  },
  setup(props, { emit }) {
    const chartRef = ref(null)
    const timeRange = ref('30')
    let chart = null

    onMounted(() => {
      if (chartRef.value) {
        chart = echarts.init(chartRef.value)
        updateChart()
      }
    })

    watch(() => props.data, updateChart)

    function updateChart() {
      if (!chart) return
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: props.data.map(item => item.date)
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: props.data.map(item => item.value),
          type: 'line',
          smooth: true
        }]
      }
      chart.setOption(option)
    }

    function handleRangeChange(value) {
      emit('rangeChange', value)
    }

    return {
      chartRef,
      timeRange,
      handleRangeChange
    }
  }
}
</script>

<style scoped>
.chart-card {
  height: 100%;
}
.chart-container {
  height: 300px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 