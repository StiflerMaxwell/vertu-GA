<template>
  <div class="traffic-analysis">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">免费流量分析</h3>
        <el-tag size="small" type="success">SEO</el-tag>
      </div>
      <div class="analysis-actions">
        <el-select v-model="timeRange" size="small" class="time-select">
          <el-option label="最近7天" value="7d" />
          <el-option label="最近30天" value="30d" />
          <el-option label="最近90天" value="90d" />
        </el-select>
      </div>
    </div>

    <div class="analysis-content">
      <!-- 主要指标卡片 -->
      <div class="main-metrics">
        <div class="metric-card primary">
          <div class="metric-header">
            <span class="metric-label">自然搜索流量</span>
            <el-tooltip content="来自搜索引擎的免费流量" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="metric-body">
            <span class="metric-value">{{ formatNumber(data.organic?.visits || 0) }}</span>
            <span class="metric-trend" :class="getTrendClass(data.organic?.trend)">
              {{ formatTrend(data.organic?.trend) }}
            </span>
          </div>
          <div class="metric-footer">
            <div class="sub-metric">
              <span>排名关键词</span>
              <span>{{ formatNumber(data.organic?.keywords || 0) }}</span>
            </div>
            <div class="sub-metric">
              <span>平均排名</span>
              <span>{{ formatNumber(data.organic?.avgPosition || 0) }}</span>
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">社交媒体</span>
            </div>
            <div class="metric-body">
              <span class="metric-value">{{ formatNumber(data.social?.visits || 0) }}</span>
              <span class="metric-trend" :class="getTrendClass(data.social?.trend)">
                {{ formatTrend(data.social?.trend) }}
              </span>
            </div>
            <div class="metric-footer">
              <div class="sub-metric">
                <span>参与度</span>
                <span>{{ formatPercent(data.social?.engagement || 0) }}</span>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">直接访问</span>
            </div>
            <div class="metric-body">
              <span class="metric-value">{{ formatNumber(data.direct?.visits || 0) }}</span>
              <span class="metric-trend" :class="getTrendClass(data.direct?.trend)">
                {{ formatTrend(data.direct?.trend) }}
              </span>
            </div>
            <div class="metric-footer">
              <div class="sub-metric">
                <span>跳出率</span>
                <span>{{ formatPercent(data.direct?.bounceRate || 0) }}</span>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">引荐流量</span>
            </div>
            <div class="metric-body">
              <span class="metric-value">{{ formatNumber(data.referral?.visits || 0) }}</span>
              <span class="metric-trend" :class="getTrendClass(data.referral?.trend)">
                {{ formatTrend(data.referral?.trend) }}
              </span>
            </div>
            <div class="metric-footer">
              <div class="sub-metric">
                <span>引荐来源</span>
                <span>{{ formatNumber(data.referral?.sources || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细分析图表 -->
      <div class="analysis-charts">
        <el-tabs v-model="activeTab" class="traffic-tabs">
          <el-tab-pane label="流量趋势" name="trend">
            <div ref="trendChartRef" class="chart-container"></div>
          </el-tab-pane>
          <el-tab-pane label="来源分布" name="distribution">
            <div ref="pieChartRef" class="chart-container"></div>
          </el-tab-pane>
          <el-tab-pane label="关键词分析" name="keywords">
            <div class="keywords-table">
              <el-table :data="data.keywords" stripe style="width: 100%">
                <el-table-column prop="keyword" label="关键词" />
                <el-table-column prop="position" label="排名" width="100" />
                <el-table-column prop="visits" label="访问量" width="120" />
                <el-table-column prop="trend" label="趋势" width="100">
                  <template #default="scope">
                    <span class="metric-trend" :class="getTrendClass(scope.row.trend)">
                      {{ formatTrend(scope.row.trend) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'

// 注册必需的组件
echarts.use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const timeRange = ref('7d')
const activeTab = ref('trend')
const trendChartRef = ref(null)
const pieChartRef = ref(null)

const formatNumber = (value) => {
  if (!value && value !== 0) return '0'
  const num = Number(value)
  if (isNaN(num)) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

const formatTrend = (value) => {
  if (!value) return '0%'
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

const getTrendClass = (value) => {
  if (!value) return ''
  return value > 0 ? 'trend-up' : 'trend-down'
}

const formatPercent = (value) => {
  if (!value && value !== 0) return '0%'
  const num = Number(value)
  if (isNaN(num)) return '0%'
  return `${num.toFixed(1)}%`
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  const chart = echarts.init(trendChartRef.value)
  
  const option = {
    // ... 趋势图配置
  }
  
  chart.setOption(option)
}

const initPieChart = () => {
  if (!pieChartRef.value) return
  const chart = echarts.init(pieChartRef.value)
  
  const option = {
    // ... 分布图配置
  }
  
  chart.setOption(option)
}

onMounted(() => {
  initTrendChart()
  initPieChart()
})
</script>

<style scoped>
.traffic-analysis {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px var(--border-color);
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.main-metrics {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.metric-card {
  background: var(--hover-bg);
  border-radius: 12px;
  padding: 20px;
  flex: 1;
}

.metric-card.primary {
  background: var(--primary-light);
  border: 1px solid var(--primary-color);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  flex: 2;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.metric-body {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
}

.metric-trend {
  font-size: 14px;
  font-weight: 500;
}

.trend-up {
  color: var(--success-color);
}

.trend-down {
  color: var(--danger-color);
}

.metric-footer {
  display: flex;
  gap: 24px;
}

.sub-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.sub-metric span:first-child {
  color: var(--text-tertiary);
}

.sub-metric span:last-child {
  color: var(--text-color);
  font-weight: 500;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.keywords-table {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-metrics {
    flex-direction: column;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .metric-footer {
    flex-wrap: wrap;
  }
}
</style> 