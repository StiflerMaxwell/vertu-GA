<template>
  <div class="dashboard">
    <div class="dashboard-container">
      <!-- 顶部导航 -->
      <header class="dashboard-header">
        <div class="header-left">
          <h1>Vertu Analytics</h1>
          <div class="real-time-indicator">
            <span class="pulse"></span>
            实时数据
          </div>
        </div>
        <div class="header-right">
          <el-button class="fullscreen-btn" type="text" @click="toggleFullscreen">
            <el-icon>
              <icon-full-screen v-if="!isFullscreen" />
              <icon-close v-else />
            </el-icon>
            {{ isFullscreen ? '退出全屏' : '全屏展示' }}
          </el-button>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            @change="handleDateChange"
          />
        </div>
      </header>

      <!-- 主要内容区域 -->
      <div class="dashboard-content">
        <!-- 核心指标卡片 -->
        <section class="section-core-metrics">
          <h2 class="section-title">核心指标</h2>
          <CoreMetrics :data="trendData" />
        </section>

        <!-- 趋势分析区域 -->
        <section class="section-trends">
          <h2 class="section-title">趋势分析</h2>
          <div class="chart-container">
            <TrendChart :data="filteredTrendData" />
          </div>
        </section>

        <!-- 用户分布区域 -->
        <section class="section-distribution">
          <h2 class="section-title">用户分布</h2>
          <div class="sort-buttons">
            <el-button @click="sortData('name')">按名称排序</el-button>
            <el-button @click="sortData('value')">按值排序</el-button>
          </div>
          <div class="distribution-grid">
            <div class="distribution-item">
              <h3><el-icon><Location /></el-icon> 地域分布</h3>
              <DistributionChart :data="geoData" />
            </div>
            <div class="distribution-item">
              <h3><el-icon><Cellphone /></el-icon> 设备分布</h3>
              <DistributionChart :data="deviceData" />
            </div>
            <div class="distribution-item">
              <h3><el-icon><PieChart /></el-icon> 访问来源</h3>
              <DistributionChart :data="sourceData" />
            </div>
          </div>
        </section>

        <!-- 用户行为指标 -->
        <section class="section-behavior">
          <h2 class="section-title">用户行为</h2>
          <div class="behavior-metrics">
            <div class="behavior-item" v-for="metric in behaviorMetrics" :key="metric.name">
              <el-icon>
                <component :is="metric.icon" />
              </el-icon>
              <div class="metric-info">
                <div class="metric-name">{{ metric.name }}</div>
                <div class="metric-value">{{ metric.value }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 数据洞察 -->
        <section class="section-insights">
          <h2 class="section-title">数据洞察</h2>
          <div class="insights-container">
            <el-row :gutter="20">
              <el-col :span="8" v-for="(insight, index) in insights" :key="index">
                <el-card class="insight-card" :class="insight.type">
                  <div class="insight-header">
                    <el-icon>
                      <component :is="getInsightIcon(insight.type)" />
                    </el-icon>
                    <span>{{ insight.title }}</span>
                  </div>
                  <div class="insight-content">{{ insight.message }}</div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ga4Client, fetchGeoDistribution, fetchDeviceDistribution, fetchSourceDistribution, fetchTrendData } from './api/ga4'
import { AnalyticsInsight } from './utils/analytics'
import DataCard from './components/DataCard.vue'
import ChartCard from './components/ChartCard.vue'
import TrendChart from './components/TrendChart.vue'
import DistributionChart from './components/DistributionChart.vue'
import CoreMetrics from './components/CoreMetrics.vue'
import {
  FullScreen as IconFullScreen,
  Close as IconClose,
  Warning as IconWarning,
  CircleCheckFilled as IconSuccess,
  InfoFilled as IconInfo,
  Timer as IconTimer,
  Document as IconDocument,
  ShoppingCart as IconShoppingCart,
  RefreshRight as IconRefresh,
  Location,
  Cellphone,
  Monitor,
  PieChart
} from '@element-plus/icons-vue'

const dateRange = ref([new Date(), new Date()])
const dataCards = ref([])
const userTrendData = ref([])
const pageViewData = ref([])
const insights = ref([])
const isFullscreen = ref(false)
const behaviorMetrics = ref([
  { 
    name: '平均访问页数', 
    value: '3.5页', 
    icon: IconDocument 
  },
  { 
    name: '平均停留时间', 
    value: '4分28秒', 
    icon: IconTimer 
  },
  { 
    name: '转化率', 
    value: '2.8%', 
    icon: IconShoppingCart 
  },
  { 
    name: '回访率', 
    value: '35%', 
    icon: IconRefresh 
  }
])

const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  }
]

const geoData = ref([])
const deviceData = ref([])
const sourceData = ref([])
const trendData = ref([])

const filteredTrendData = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return trendData.value
  const [startDate, endDate] = dateRange.value
  const filtered = trendData.value.filter(item => {
    const itemDate = new Date(item.date)
    return itemDate >= startDate && itemDate <= endDate
  })
  console.log('过滤后的趋势数据:', filtered)
  return filtered
})

// 添加数据监听
watch(trendData, (newVal) => {
  console.log('趋势数据更新:', newVal)
}, { deep: true })

watch(geoData, (newVal) => {
  console.log('地域数据更新:', newVal)
}, { deep: true })

watch(deviceData, (newVal) => {
  console.log('设备数据更新:', newVal)
}, { deep: true })

watch(sourceData, (newVal) => {
  console.log('来源数据更新:', newVal)
}, { deep: true })

async function fetchData() {
  try {
    console.log('开始获取数据...')
    const [geo, device, source, trend] = await Promise.all([
      fetchGeoDistribution(),
      fetchDeviceDistribution(),
      fetchSourceDistribution(),
      fetchTrendData()
    ])
    
    console.log('数据获取成功:', { geo, device, source, trend })
    
    geoData.value = geo
    deviceData.value = device
    sourceData.value = source
    trendData.value = trend

    const data = await ga4Client.fetchAnalyticsData();
    updateDashboard(data)
  } catch (error) {
    console.error('获取数据失败:', error)
    updateDashboard(null)
  }
}

function updateDashboard(data) {
  if (!data?.rows) {
    console.warn('No analytics data available')
    setDefaultValues()
    return
  }

  try {
    const latestData = data.rows[0]
    const previousData = data.rows[1]
    const weekAgoData = data.rows[7] || previousData

    // 计算同比增长
    const calculateGrowth = (current, previous) => {
      if (!previous) return 0
      return ((Number(current) - Number(previous)) / Number(previous) * 100).toFixed(1)
    }

    // 更新核心指标
    dataCards.value = [
      {
        title: '实时用户',
        value: formatNumber(latestData.metricValues[0].value),
        trend: calculateGrowth(
          latestData.metricValues[0].value,
          previousData?.metricValues[0].value
        ),
        description: '过去24小时内的活跃用户数'
      },
      {
        title: '页面浏览',
        value: formatNumber(latestData.metricValues[1].value),
        trend: calculateGrowth(
          latestData.metricValues[1].value,
          previousData?.metricValues[1].value
        ),
        description: '过去24小时内的页面浏览量'
      },
      {
        title: '平均访问时长',
        value: formatDuration(latestData.metricValues[2].value),
        trend: calculateGrowth(
          latestData.metricValues[2].value,
          previousData?.metricValues[2].value
        ),
        description: '过去24小时内的平均访问时长'
      },
      {
        title: '跳出率',
        value: formatPercentage(latestData.metricValues[3].value),
        trend: calculateGrowth(
          latestData.metricValues[3].value,
          previousData?.metricValues[3].value
        ),
        description: '过去24小时内的跳出率'
      }
    ]

    // 深度分析用户行为
    const userGrowth = calculateGrowth(
      latestData.metricValues[0].value,
      weekAgoData.metricValues[0].value
    )
    
    const bounceRateChange = calculateGrowth(
      latestData.metricValues[3].value,
      weekAgoData.metricValues[3].value
    )

    const avgDurationChange = calculateGrowth(
      latestData.metricValues[2].value,
      weekAgoData.metricValues[2].value
    )

    // 更新深度分析洞察
    insights.value = [
      {
        type: userGrowth > 0 ? 'success' : 'warning',
        title: '用户增长分析',
        message: `周同比${userGrowth > 0 ? '增长' : '下降'}${Math.abs(userGrowth)}%，${
          userGrowth > 0 
            ? '用户增长趋势良好，建议持续优化获客渠道' 
            : '建议分析用户流失原因，优化用户体验'
        }`
      },
      {
        type: bounceRateChange < 0 ? 'success' : 'warning',
        title: '用户参与度分析',
        message: `跳出率${bounceRateChange < 0 ? '下降' : '上升'}${Math.abs(bounceRateChange)}%，${
          bounceRateChange < 0
            ? '用户粘性提升，内容吸引力增强'
            : '建议优化首页体验，增加用户引导'
        }`
      },
      {
        type: avgDurationChange > 0 ? 'success' : 'info',
        title: '用户行为洞察',
        message: `平均访问时长${avgDurationChange > 0 ? '增加' : '减少'}${Math.abs(avgDurationChange)}%，${
          avgDurationChange > 0
            ? '用户深度参与度提升，内容价值获得认可'
            : '建议优化内容质量，增加互动环节'
        }`
      }
    ]

    // 更新用户行为指标
    behaviorMetrics.value = [
      {
        name: '平均访问深度',
        value: `${(Number(latestData.metricValues[1].value) / Number(latestData.metricValues[0].value)).toFixed(1)}页`,
        icon: IconDocument,
        trend: calculateGrowth(
          Number(latestData.metricValues[1].value) / Number(latestData.metricValues[0].value),
          Number(weekAgoData.metricValues[1].value) / Number(weekAgoData.metricValues[0].value)
        )
      },
      {
        name: '平均访问时长',
        value: formatDuration(latestData.metricValues[2].value),
        icon: IconTimer,
        trend: avgDurationChange
      },
      {
        name: '跳出率',
        value: formatPercentage(latestData.metricValues[3].value),
        icon: IconWarning,
        trend: -bounceRateChange // 反向显示，跳出率下降是好事
      },
      {
        name: '用户活跃度',
        value: `${(Number(latestData.metricValues[1].value) * 100 / Number(latestData.metricValues[0].value)).toFixed(1)}%`,
        icon: IconRefresh,
        trend: calculateGrowth(
          Number(latestData.metricValues[1].value) / Number(latestData.metricValues[0].value),
          Number(weekAgoData.metricValues[1].value) / Number(weekAgoData.metricValues[0].value)
        )
      }
    ]

    // 更新图表数据（按时间正序排列）
    const sortedRows = data.rows.slice().sort((a, b) => 
      a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value)
    );

    userTrendData.value = sortedRows.map(row => ({
      date: formatDate(row.dimensionValues[0].value),
      value: Number(row.metricValues[0].value)
    }));

    pageViewData.value = sortedRows.map(row => ({
      date: formatDate(row.dimensionValues[0].value),
      value: Number(row.metricValues[1].value)
    }));
  } catch (error) {
    console.error('Error processing GA4 data:', error)
    setDefaultValues()
  }
}

// 优化的辅助函数
function formatNumber(value) {
  const num = Number(value);
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function formatPercentage(value) {
  return (Number(value) * 100).toFixed(1) + '%';
}

function formatDate(dateString) {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  return `${month}-${day}`;
}

function formatDuration(seconds) {
  const totalSeconds = Math.floor(Number(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes}分`;
  } else {
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  }
}

function setDefaultValues() {
  dataCards.value = [
    { title: '实时用户', value: '0', trend: 0 },
    { title: '页面浏览', value: '0', trend: 0 },
    { title: '平均访问时长', value: '0分钟', trend: 0 },
    { title: '跳出率', value: '0%', trend: 0 }
  ];
  userTrendData.value = [];
  pageViewData.value = [];
}

function handleDateChange() {
  console.log('日期变更:', dateRange.value)
  fetchData()
}

function handleChartRangeChange() {
  fetchData()
}

// 全屏相关方法
const toggleFullscreen = () => {
  if (!isFullscreen.value) {
    const element = document.documentElement
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
}

// 监听全屏变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement)
}

// 监听 ESC 键
const handleKeyPress = (event) => {
  if (event.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
  }
}

// 修改 getInsightIcon 函数
const getInsightIcon = (type) => {
  const icons = {
    success: IconSuccess,
    warning: IconWarning,
    info: IconInfo,
    error: IconWarning
  }
  return icons[type] || IconInfo
}

// 图标映射
const iconMap = {
  geo: Location,
  device: Cellphone,
  pc: Monitor,
  source: PieChart
}

onMounted(async () => {
  console.log('组件挂载')
  await fetchData()
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('msfullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('msfullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeyPress)
})

const sortData = (key) => {
  geoData.value.sort((a, b) => key === 'name' ? a.name.localeCompare(b.name) : b.value - a.value)
  deviceData.value.sort((a, b) => key === 'name' ? a.name.localeCompare(b.name) : b.value - a.value)
  sourceData.value.sort((a, b) => key === 'name' ? a.name.localeCompare(b.name) : b.value - a.value)
}
</script>

<style>
.dashboard {
  width: 100%;
  min-height: 100vh;
  background: #1e1e2d;
  color: #ffffff;
  padding: 24px;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-left h1 {
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(45deg, #00dc82, #54a0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dashboard-content {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 区域通用样式 */
section {
  width: 100%;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24px;
  padding-left: 16px;
  border-left: 4px solid #00dc82;
}

/* 核心指标区域 */
.data-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.data-cards > div {
  flex: 1;
  min-width: 280px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  transition: transform 0.3s ease;
}

/* 图表区域 */
.chart-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  height: 400px;
}

/* 行为指标区域 */
.behavior-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.behavior-metrics > div {
  flex: 1;
  min-width: 260px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
}

/* 数据洞察区域 */
.insights-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.insights-container .insight-card {
  flex: 1;
  min-width: 320px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
}

.insight-card .insight-content h4 {
  color: #ffffff;
  font-size: 18px;
  margin-bottom: 12px;
}

.insight-card .insight-content p {
  color: #ffffff;
  opacity: 0.85;
  line-height: 1.6;
}

/* 响应式调整 */
@media screen and (max-width: 1400px) {
  .dashboard-content {
    gap: 24px;
  }
  
  section {
    padding: 20px;
  }
  
  .chart-container {
    height: 350px;
  }
}

@media screen and (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .data-cards > div,
  .behavior-metrics > div,
  .insights-container > div {
    min-width: 100%;
  }
  
  .chart-container {
    height: 300px;
  }
}

/* 动效 */
.data-cards > div:hover,
.behavior-metrics > div:hover,
.insights-container .insight-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 用户分布区域样式 */
.distribution-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 20px;
}

.distribution-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  height: 360px;
}

.distribution-item h3 {
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 16px;
  opacity: 0.9;
}

/* 响应式调整 */
@media screen and (max-width: 1400px) {
  .distribution-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .distribution-grid {
    grid-template-columns: 1fr;
  }
  
  .distribution-item {
    height: 300px;
  }
}

/* 添加排序按钮样式 */
.sort-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
</style> 