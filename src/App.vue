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
            :clearable="true"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </div>
      </header>

      <!-- 主要内容区域 -->
      <div class="dashboard-content">
        <el-loading :full-screen="false" :element-loading-text="'加载中...'" v-if="loading" />
        
        <template v-else>
          <!-- 核心指标卡片 -->
          <section class="section-core-metrics" v-if="trendData && trendData.length > 0">
            <h2 class="section-title">核心指标</h2>
            <CoreMetrics :data="trendData" />
          </section>

          <!-- 趋势分析区域 -->
          <section class="section-trends" v-if="trendData && trendData.length > 0">
            <h2 class="section-title">趋势分析</h2>
            <div class="chart-container">
              <TrendChart :data="trendData" />
            </div>
          </section>

          <!-- 添加数据洞察部分 -->
          <section class="section-insights" v-if="trendInsights.length > 0">
            <h2 class="section-title">数据洞察</h2>
            <div class="insights-grid">
              <el-card class="insight-card" v-for="(insight, index) in trendInsights" :key="index">
                <template #header>
                  <div class="insight-header">
                    <el-icon :size="20" :color="insight.type === 'positive' ? '#67C23A' : '#F56C6C'">
                      <component :is="insight.type === 'positive' ? 'ArrowUp' : 'ArrowDown'" />
                    </el-icon>
                    <span>{{ insight.title }}</span>
                  </div>
                </template>
                <div class="insight-content">
                  {{ insight.content }}
                </div>
              </el-card>
            </div>
          </section>

          <!-- 用户分布区域 -->
          <section class="section-distribution">
            <h2 class="section-title">用户分布</h2>
            <div class="distribution-grid">
              <div class="distribution-item" v-if="geoData.length > 0">
                <h3><el-icon><Location /></el-icon> 地域分布</h3>
                <DistributionChart :data="geoData" />
              </div>
              <div class="distribution-item" v-if="deviceData.length > 0">
                <h3><el-icon><Cellphone /></el-icon> 设备分布</h3>
                <DistributionChart :data="deviceData" />
              </div>
              <div class="distribution-item" v-if="sourceData.length > 0">
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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, markRaw } from 'vue'
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
  PieChart,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
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

const iconMap = markRaw({
  geo: Location,
  device: Cellphone,
  pc: Monitor,
  source: PieChart
})

const formatDate = (date) => {
  if (!date) return ''
  // 处理特殊日期
  if (typeof date === 'string') {
    if (date === '30daysAgo' || date === 'today') {
      return date
    }
    // 如果已经是 YYYY-MM-DD 格式，直接返回
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date
    }
  }
  
  // 处理 Date 对象
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`  // 使用 YYYY-MM-DD 格式
}

const fetchData = async (start, end) => {
  loading.value = true
  try {
    // 打印请求参数
    console.log('请求参数:', { start, end })

    const trend = await fetchTrendData(start, end)
    // 打印原始趋势数据
    console.log('原始趋势数据:', trend)

    if (Array.isArray(trend) && trend.length > 0) {
      trendData.value = trend
      // 打印处理后的趋势数据
      console.log('处理后的趋势数据:', trendData.value)
    } else {
      console.warn('趋势数据无效:', trend)
    }

    const [geo, device, source] = await Promise.all([
      fetchGeoDistribution(start, end),
      fetchDeviceDistribution(start, end),
      fetchSourceDistribution(start, end)
    ])

    geoData.value = geo
    deviceData.value = device
    sourceData.value = source
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleDateChange = async (val) => {
  console.log('原始日期值:', val)
  
  if (!val) {
    console.log('使用默认日期范围')
    await fetchData('30daysAgo', 'today')
    return
  }

  const [start, end] = val
  const startDate = formatDate(start)
  const endDate = formatDate(end)
  console.log('格式化后的日期范围:', { startDate, endDate })
  
  await fetchData(startDate, endDate)
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

onMounted(async () => {
  console.log('组件挂载')
  await fetchData('30daysAgo', 'today')
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

// 计算数据洞察
const trendInsights = computed(() => {
  if (!trendData.value || trendData.value.length < 2) return []

  const latest = trendData.value[trendData.value.length - 1]
  const previous = trendData.value[trendData.value.length - 2]

  const insights = []

  // 活跃用户变化
  const userChange = (latest.metricValues[0].value - previous.metricValues[0].value) / previous.metricValues[0].value * 100
  insights.push({
    title: '活跃用户变化',
    content: `相比前一天${userChange > 0 ? '增长' : '下降'}了 ${Math.abs(userChange).toFixed(2)}%`,
    type: userChange > 0 ? 'positive' : 'negative'
  })

  // 页面浏览量变化
  const viewChange = (latest.metricValues[1].value - previous.metricValues[1].value) / previous.metricValues[1].value * 100
  insights.push({
    title: '页面浏览量变化',
    content: `相比前一天${viewChange > 0 ? '增长' : '下降'}了 ${Math.abs(viewChange).toFixed(2)}%`,
    type: viewChange > 0 ? 'positive' : 'negative'
  })

  // 平均会话时长变化
  const durationChange = (latest.metricValues[2].value - previous.metricValues[2].value) / previous.metricValues[2].value * 100
  insights.push({
    title: '平均会话时长变化',
    content: `相比前一天${durationChange > 0 ? '增长' : '下降'}了 ${Math.abs(durationChange).toFixed(2)}%`,
    type: durationChange > 0 ? 'positive' : 'negative'
  })

  // 跳出率变化
  const bounceChange = (latest.metricValues[3].value - previous.metricValues[3].value) / previous.metricValues[3].value * 100
  insights.push({
    title: '跳出率变化',
    content: `相比前一天${bounceChange > 0 ? '增长' : '下降'}了 ${Math.abs(bounceChange).toFixed(2)}%`,
    type: bounceChange < 0 ? 'positive' : 'negative'  // 跳出率下降是好事
  })

  return insights
})
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
.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.insight-card {
  background: #fff;
  border-radius: 8px;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.insight-content {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.section-insights {
  margin-top: 24px;
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