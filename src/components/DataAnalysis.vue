<template>
  <div class="analysis-section">
    <div class="analysis-header">
      <h3>数据洞察</h3>
      <el-radio-group v-model="analysisType" size="small">
        <el-radio-button label="overview">概览</el-radio-button>
        <el-radio-button label="users">用户分析</el-radio-button>
        <el-radio-button label="conversion">转化分析</el-radio-button>
      </el-radio-group>
    </div>

    <div class="analysis-content">
      <!-- 概览分析 -->
      <div v-if="analysisType === 'overview'" class="overview-analysis">
        <div class="insight-cards">
          <el-card v-for="(insight, index) in insights" :key="index" class="insight-card">
            <template #header>
              <div class="insight-header">
                <el-icon :class="insight.type"><component :is="insight.icon" /></el-icon>
                <span>{{ insight.title }}</span>
              </div>
            </template>
            <div class="insight-body">
              <p class="insight-text">{{ insight.description }}</p>
              <div class="insight-data">
                <div class="data-item">
                  <span class="data-label">变化幅度</span>
                  <span class="data-value" :class="insight.trend">{{ insight.change }}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">置信度</span>
                  <el-rate
                    v-model="insight.confidence"
                    :max="3"
                    disabled
                    text-color="#ff9900"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="analysis-charts">
          <div class="chart-wrapper">
            <h4>用户活跃度分布</h4>
            <div class="activity-chart" ref="activityChartRef"></div>
          </div>
          <div class="chart-wrapper">
            <h4>转化漏斗</h4>
            <div class="funnel-chart" ref="funnelChartRef"></div>
          </div>
        </div>
      </div>

      <!-- 用户分析 -->
      <div v-if="analysisType === 'users'" class="user-analysis">
        <div class="cohort-analysis">
          <h4>用户群体分析</h4>
          <el-table :data="cohortData" style="width: 100%" size="small">
            <el-table-column prop="group" label="用户群" width="180">
              <template #default="{ row }">
                <div class="group-cell">
                  <el-icon><UserFilled /></el-icon>
                  <span>{{ row.group }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="用户数" width="120" />
            <el-table-column prop="retention" label="留存率" width="180">
              <template #default="{ row }">
                <div class="retention-cell">
                  <div class="retention-bar" :style="{ width: row.retention + '%' }"></div>
                  <span>{{ row.retention }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="engagement" label="参与度" width="180">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.engagement" 
                  :color="getEngagementColor(row.engagement)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="trend" label="趋势" width="120">
              <template #default="{ row }">
                <spark-line :data="row.trend" :color="row.trendColor" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 转化分析 -->
      <div v-if="analysisType === 'conversion'" class="conversion-analysis">
        <div class="conversion-metrics">
          <div class="conversion-card" v-for="(metric, index) in conversionMetrics" :key="index">
            <div class="conversion-title">{{ metric.title }}</div>
            <div class="conversion-value">{{ metric.value }}%</div>
            <div class="conversion-trend" :class="metric.trend">
              <el-icon>
                <component :is="metric.trend === 'up' ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
              <span>{{ metric.change }}%</span>
            </div>
          </div>
        </div>
        <div class="conversion-path">
          <div class="path-node" v-for="(node, index) in conversionPath" :key="index">
            <div class="node-content">
              <div class="node-title">{{ node.title }}</div>
              <div class="node-value">{{ node.value }}</div>
              <div class="node-rate">转化率 {{ node.rate }}%</div>
            </div>
            <el-icon v-if="index < conversionPath.length - 1"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import {
  TrendCharts,
  Warning,
  UserFilled,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from '@element-plus/icons-vue'

const analysisType = ref('overview')
const activityChartRef = ref(null)
const funnelChartRef = ref(null)
let activityChart = null
let funnelChart = null

// 数据洞察
const insights = ref([
  {
    title: '用户增长异常',
    description: '过去7天新用户增长率显著提升，主要来自搜索引擎流量',
    type: 'warning',
    icon: 'TrendCharts',
    change: '+45.8%',
    trend: 'up',
    confidence: 3
  },
  {
    title: '转化率下降',
    description: '核心转化路径的转化率出现下降趋势，建议关注页面性能',
    type: 'danger',
    icon: 'Warning',
    change: '-12.3%',
    trend: 'down',
    confidence: 2
  }
])

// 用户群体数据
const cohortData = ref([
  {
    group: '新用户',
    size: 1234,
    retention: 65,
    engagement: 78,
    trend: [30, 40, 35, 50, 49, 60, 70],
    trendColor: '#67C23A'
  },
  {
    group: '回访用户',
    size: 892,
    retention: 85,
    engagement: 92,
    trend: [80, 85, 90, 88, 87, 90, 92],
    trendColor: '#409EFF'
  }
])

// 转化指标
const conversionMetrics = ref([
  {
    title: '整体转化率',
    value: 2.8,
    trend: 'up',
    change: 0.5
  },
  {
    title: '加购转化率',
    value: 8.5,
    trend: 'up',
    change: 1.2
  },
  {
    title: '注册转化率',
    value: 12.3,
    trend: 'down',
    change: 2.1
  }
])

// 转化路径
const conversionPath = ref([
  {
    title: '访问',
    value: '10,000',
    rate: 100
  },
  {
    title: '浏览商品',
    value: '6,500',
    rate: 65
  },
  {
    title: '加入购物车',
    value: '2,800',
    rate: 43
  },
  {
    title: '完成购买',
    value: '800',
    rate: 28.6
  }
])

// 工具函数
const getEngagementColor = (value) => {
  if (value >= 80) return '#67C23A'
  if (value >= 60) return '#E6A23C'
  return '#F56C6C'
}

// 图表初始化
onMounted(() => {
  // 初始化活跃度分布图表
  activityChart = echarts.init(activityChartRef.value)
  const activityOption = {
    // ... 活跃度图表配置
  }
  activityChart.setOption(activityOption)

  // 初始化漏斗图表
  funnelChart = echarts.init(funnelChartRef.value)
  const funnelOption = {
    // ... 漏斗图表配置
  }
  funnelChart.setOption(funnelOption)

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  activityChart?.dispose()
  funnelChart?.dispose()
})

const handleResize = () => {
  activityChart?.resize()
  funnelChart?.resize()
}
</script>

<style scoped>
.analysis-section {
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.analysis-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
}

.insight-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.insight-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
}

.insight-header .el-icon {
  font-size: 18px;
}

.insight-header .warning {
  color: #E6A23C;
}

.insight-header .danger {
  color: #F56C6C;
}

.insight-text {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 16px 0;
}

.insight-data {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.data-value {
  font-size: 16px;
  font-weight: 500;
}

.data-value.up {
  color: #67C23A;
}

.data-value.down {
  color: #F56C6C;
}

.analysis-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-wrapper {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 16px;
}

.chart-wrapper h4 {
  margin: 0 0 16px 0;
  color: rgba(255, 255, 255, 0.9);
}

.activity-chart,
.funnel-chart {
  height: 300px;
}

.cohort-analysis {
  margin-top: 20px;
}

.group-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.retention-cell {
  position: relative;
  display: flex;
  align-items: center;
}

.retention-bar {
  position: absolute;
  left: 0;
  height: 4px;
  background: #409EFF;
  border-radius: 2px;
  opacity: 0.2;
}

.conversion-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.conversion-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 16px;
}

.conversion-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 8px;
}

.conversion-value {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.conversion-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.conversion-trend.up {
  color: #67C23A;
}

.conversion-trend.down {
  color: #F56C6C;
}

.conversion-path {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.path-node {
  display: flex;
  align-items: center;
  gap: 16px;
}

.node-content {
  text-align: center;
}

.node-title {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.node-value {
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
}

.node-rate {
  color: #409EFF;
  font-size: 12px;
}

:deep(.el-table) {
  background: transparent;
  
  th.el-table__cell {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  td.el-table__cell {
    background: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
  }
}
</style> 