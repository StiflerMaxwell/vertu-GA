<template>
  <div class="source-analysis">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">访问来源分析</h3>
        <el-tag size="small" type="warning">流量</el-tag>
      </div>
      <div class="analysis-actions">
        <el-radio-group v-model="viewType" size="small">
          <el-radio-button label="table">表格</el-radio-button>
          <el-radio-button label="chart">图表</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="analysis-content">
      <!-- 表格视图 -->
      <div v-show="viewType === 'table'" class="table-view">
        <el-table :data="sourceData" style="width: 100%" :max-height="400">
          <el-table-column prop="source" label="来源" min-width="180">
            <template #default="{ row }">
              <div class="source-info">
                <el-icon :class="getSourceIcon(row.type)">
                  <component :is="getSourceIcon(row.type)" />
                </el-icon>
                <span>{{ row.source }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="visits" label="访问量" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.visits) }}
            </template>
          </el-table-column>
          <el-table-column prop="users" label="用户数" width="120">
            <template #default="{ row }">
              {{ formatNumber(row.users) }}
            </template>
          </el-table-column>
          <el-table-column prop="bounceRate" label="跳出率" width="100">
            <template #default="{ row }">
              {{ formatPercent(row.bounceRate) }}
            </template>
          </el-table-column>
          <el-table-column prop="avgDuration" label="平均时长" width="120">
            <template #default="{ row }">
              {{ formatDuration(row.avgDuration) }}
            </template>
          </el-table-column>
          <el-table-column prop="trend" label="趋势" width="100">
            <template #default="{ row }">
              <span class="metric-trend" :class="getTrendClass(row.trend)">
                {{ formatTrend(row.trend) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 图表视图 -->
      <div v-show="viewType === 'chart'" class="chart-view">
        <div ref="chartRef" class="source-chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { TreemapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import {
  Link,
  Share,
  Search,
  Position,
  ChatDotRound,
  Connection
} from '@element-plus/icons-vue'

echarts.use([
  CanvasRenderer,
  TreemapChart,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
])

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const viewType = ref('table')
const chartRef = ref(null)
let chart = null

// 格式化数字
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return new Intl.NumberFormat().format(num)
}

// 格式化百分比
const formatPercent = (value) => {
  if (!value && value !== 0) return '0%'
  return `${value.toFixed(1)}%`
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '0秒'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return `${seconds}秒`
  return `${minutes}分${seconds % 60}秒`
}

// 格式化趋势
const formatTrend = (value) => {
  if (!value && value !== 0) return '0%'
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

// 获取趋势类名
const getTrendClass = (value) => {
  if (!value) return ''
  return value > 0 ? 'trend-up' : 'trend-down'
}

// 获取来源图标
const getSourceIcon = (type) => {
  const icons = {
    search: Search,
    social: Share,
    direct: Link,
    referral: Connection,
    email: ChatDotRound,
    other: Position
  }
  return icons[type] || Position
}

// 处理数据源
const sourceData = computed(() => {
  return props.data.sources || []
})

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表
const updateChart = () => {
  if (!chart) return

  const option = {
    tooltip: {
      formatter: function (info) {
        const value = info.value
        const trendText = value.trend > 0 ? `+${value.trend}%` : `${value.trend}%`
        return `
          <div style="margin: 8px 0">
            <b>${info.name}</b><br/>
            访问量：${formatNumber(value.visits)}<br/>
            用户数：${formatNumber(value.users)}<br/>
            跳出率：${formatPercent(value.bounceRate)}<br/>
            趋势：${trendText}
          </div>
        `
      }
    },
    series: [{
      type: 'treemap',
      data: sourceData.value.map(item => ({
        name: item.source,
        value: [item.visits, item.users, item.bounceRate, item.trend],
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
          gapWidth: 1
        }
      })),
      label: {
        show: true,
        formatter: '{b}\n{c0}',
        fontSize: 14
      },
      breadcrumb: {
        show: false
      }
    }]
  }

  chart.setOption(option)
}

// 监听数据变化
watch(() => props.data, updateChart, { deep: true })

// 监听视图类型变化
watch(viewType, () => {
  if (viewType.value === 'chart') {
    nextTick(() => {
      initChart()
    })
  }
})

onMounted(() => {
  if (viewType.value === 'chart') {
    initChart()
  }
})

// 处理窗口大小变化
onMounted(() => {
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  window.removeEventListener('resize', () => chart?.resize())
  chart?.dispose()
})
</script>

<style scoped>
.source-analysis {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px var(--border-color);
  width: 100%;
  overflow: hidden;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--border-color);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analysis-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.analysis-content {
  width: 100%;
}

.table-view {
  width: 100%;
  overflow-x: auto;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-info .el-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.chart-view {
  margin-top: 20px;
  width: 100%;
  height: 400px;
}

.source-chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

:deep(.el-table) {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: var(--hover-bg);
  --el-table-row-hover-bg-color: var(--hover-color);
  background: var(--card-bg);
}

:deep(.el-table th) {
  background-color: var(--hover-bg);
  font-weight: 600;
  color: var(--text-color);
}

:deep(.el-table td) {
  color: var(--text-color);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: var(--hover-bg);
}

.metric-trend {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.trend-up {
  color: var(--success-color);
  background: var(--success-light);
}

.trend-down {
  color: var(--danger-color);
  background: var(--danger-light);
}

@media (max-width: 768px) {
  .source-analysis {
    padding: 16px;
  }
  
  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding-bottom: 12px;
  }
  
  .analysis-actions {
    width: 100%;
  }
  
  .chart-view,
  .source-chart {
    height: 300px;
  }
}
</style> 