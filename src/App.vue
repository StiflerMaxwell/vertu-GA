<template>
  <div class="dashboard" :class="{ 'dark': isDark }">
    <!-- 全屏 Loading -->
    <div v-if="loading" class="global-loading">
      <div class="loading-content">
        <div class="loading-spinner">
          <svg viewBox="25 25 50 50" class="circular">
            <circle cx="50" cy="50" r="20" fill="none" class="path"></circle>
          </svg>
        </div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>

    <div v-else class="dashboard-container">
      <div class="dashboard-content">
        <header class="dashboard-header">
          <div class="title-section">
            <h1 class="dashboard-title">
              <span class="brand">Vertu</span>
              <span class="analytics">Analytics</span>
            </h1>
            <div class="realtime-indicator">
              实时数据
              <span class="pulse-dot"></span>
            </div>
          </div>
          <div class="dashboard-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :size="'default'"
              class="custom-date-picker"
              value-format="YYYY-MM-DD"
              :default-value="defaultDates"
              @change="handleDateChange"
            />
            <el-button 
              type="primary" 
              class="refresh-button"
              :class="{ 'is-loading': loading }"
              @click="refreshData"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button
              class="theme-toggle"
              :class="{ 'is-dark': isDark }"
              @click="toggleTheme"
            >
              <el-icon v-if="isDark"><Sunny /></el-icon>
              <el-icon v-else><Moon /></el-icon>
            </el-button>
          </div>
        </header>

        <el-loading :full-screen="false" :element-loading-text="'加载中...'" v-if="loading" />
        
        <template v-else>
          <!-- 核心指标卡片 -->
          <section class="section-core-metrics">
            <h2 class="section-title">核心指标</h2>
            <CoreMetrics 
              :start-date="startDate" 
              :end-date="endDate" 
              :key="`core-metrics-${dateKey}`"
            />
          </section>

          <!-- 趋势分析区域 -->
          <section class="section-trends">
            <h2 class="section-title">趋势分析</h2>
            <div class="chart-container">
              <TrendChart 
                :start-date="startDate" 
                :end-date="endDate" 
                :key="`trend-chart-${dateKey}`"
              />
            </div>
          </section>

          <!-- 免费流量分析 -->
          <section class="section-traffic">
            <FreeTrafficAnalysis 
              :start-date="startDate" 
              :end-date="endDate" 
              :key="`free-traffic-${dateKey}`"
            />
          </section>

          <!-- 访问来源分析 -->
          <section class="section-source">
            <TrafficSourceAnalysis 
              :start-date="startDate" 
              :end-date="endDate" 
              :key="`traffic-source-${dateKey}`"
            />
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
import FreeTrafficAnalysis from './components/FreeTrafficAnalysis.vue'
import TrafficSourceAnalysis from './components/TrafficSourceAnalysis.vue'
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
  ArrowDown,
  Moon,
  Sunny
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const dateRange = ref(null)
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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

const startDate = ref('')
const endDate = ref('')
const dateKey = ref(0)

// 日期处理
const handleDateChange = async (dates) => {
  console.log('Date range changed:', dates)
  if (dates) {
    startDate.value = dates[0]
    endDate.value = dates[1]
    dateKey.value++ // 更新key触发组件重新渲染
    await refreshData()
  }
}

// 刷新所有数据
const refreshData = async () => {
  if (!startDate.value || !endDate.value) {
    ElMessage.warning('请选择日期范围')
    return
  }

  loading.value = true
  try {
    console.log('Refreshing data with dates:', {
      start: startDate.value,
      end: endDate.value
    })
    
    // 这里添加其他数据获取逻辑
    // await fetchTrendData()
    // await fetchCoreMetrics()
    
    ElMessage.success('数据已更新')
  } catch (error) {
    console.error('Error refreshing data:', error)
    ElMessage.error('数据更新失败')
  } finally {
    loading.value = false
  }
}

// 初始化默认日期范围
const initDefaultDates = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 7)
  
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  startDate.value = formatDate(start)
  endDate.value = formatDate(end)
  dateRange.value = [startDate.value, endDate.value]
  dateKey.value++
  
  console.log('Initialized dates:', {
    startDate: startDate.value,
    endDate: endDate.value,
    dateRange: dateRange.value
  })
  
  // 初始化时加载数据
  refreshData()
}

// 在组件挂载时初始化日期
onMounted(() => {
  initDefaultDates()
})

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

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  // 保存主题偏好到本地存储
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  // 更新 HTML 根元素的 class
  document.documentElement.classList.toggle('dark', isDark.value)
}

// 初始化主题
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
    document.documentElement.classList.toggle('dark', isDark.value)
  } else {
    // 检查系统主题偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
    document.documentElement.classList.toggle('dark', prefersDark)
  }
})

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

// 添加免费流量数据
const trafficData = ref({
  organic: {
    visits: 15234,
    trend: 5.2,
    keywords: 1250,
    avgPosition: 12.5
  },
  social: {
    visits: 8765,
    trend: -2.1,
    engagement: 3.2
  },
  direct: {
    visits: 12543,
    trend: 3.8,
    bounceRate: 45.6
  },
  referral: {
    visits: 6789,
    trend: 1.5,
    sources: 89
  },
  keywords: [
    { keyword: "vertu phone", position: 1, visits: 2345, trend: 5.2 },
    { keyword: "luxury phone", position: 3, visits: 1890, trend: -1.2 },
    { keyword: "premium smartphone", position: 5, visits: 1567, trend: 2.8 }
  ]
})
</script>

<style>
/* 深色模式变量 */
:root {
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-color: #1a1a1a;
  --border-color: rgba(0, 0, 0, 0.05);
  --hover-color: rgba(0, 0, 0, 0.02);
}

:root.dark {
  --bg-color: #1a1a1a;
  --card-bg: #2c2c2c;
  --text-color: #ffffff;
  --border-color: rgba(255, 255, 255, 0.1);
  --hover-color: rgba(255, 255, 255, 0.05);
}
</style>

<style scoped>
.dashboard {
  min-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  background: var(--bg-color);
  margin: 0;
  padding: 0;
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.dashboard-container {
  width: 100vw;
  max-width: 100vw;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  margin: 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: var(--card-bg);
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 1px 3px var(--border-color);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand {
  background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: 900;
}

.analytics {
  background: linear-gradient(to right, #3494E6, #EC6EAD);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: 800;
}

/* 深色模式下的渐变 */
:root.dark .brand {
  background: linear-gradient(135deg, #ffffff 0%, #a8a8b2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

:root.dark .analytics {
  background: linear-gradient(to right, #64B3F4, #FF69B4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

/* 添加悬停效果 */
.dashboard-title:hover .brand {
  animation: shimmer 2s infinite;
}

.dashboard-title:hover .analytics {
  animation: shimmer 2s infinite 0.5s;
}

@keyframes shimmer {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
  }
}

.realtime-indicator {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #10B981;
  background: rgba(16, 185, 129, 0.1);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 500;
  position: relative;
  padding-right: 28px;
  transition: all 0.3s ease;
}

.realtime-indicator:hover {
  background: rgba(16, 185, 129, 0.15);
}

.pulse-dot {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background-color: #10B981;
  border-radius: 50%;
}

.pulse-dot::before,
.pulse-dot::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #10B981;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.pulse-dot::after {
  animation-delay: 0.5s;
}

.dashboard-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.custom-date-picker {
  width: 320px;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.refresh-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 0;
}

.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  background: var(--card-bg);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px var(--border-color);
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

/* 响应式设计 */
@media (max-width: 1600px) {
  :deep(.metrics-grid) {
    gap: 20px;
    margin: 0 -8px;
  }

  :deep(.metric-card) {
    margin: 0 8px;
    padding: 20px 24px;
  }

  .chart-container {
    padding: 24px 32px;
  }
}

@media (max-width: 1200px) {
  :deep(.metrics-grid) {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 16px;
  }

  .dashboard-header {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .title-section {
    width: 100%;
  }

  .dashboard-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .custom-date-picker {
    width: 100%;
  }

  .chart-container {
    padding: 20px;
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

/* 响应式设计 */
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

/* 调整内容区域的左右边距 */
@media (min-width: 1660px) {
  .dashboard-content {
    padding: 24px 32px;
  }
}

@media (max-width: 1659px) {
  .dashboard-content {
    padding: 24px;
  }
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
}

.circular {
  width: 100%;
  height: 100%;
  animation: loading-rotate 2s linear infinite;
}

.path {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 3;
  stroke: #409EFF;
  stroke-linecap: round;
  animation: loading-dash 1.5s ease-in-out infinite;
}

.loading-text {
  color: var(--text-color);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40px;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120px;
  }
}

.theme-toggle {
  width: 40px;
  height: 40px;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.theme-toggle:hover {
  background: var(--hover-color);
  transform: translateY(-1px);
}

.theme-toggle.is-dark {
  color: #ffd700;
}

.theme-toggle .el-icon {
  font-size: 20px;
}

.dashboard-charts {
  display: flex;
  gap: 24px;
}

.analysis-section {
  margin-top: 24px;
  width: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-content {
    gap: 16px;
  }
  
  .analysis-section {
    margin-top: 16px;
  }
}
</style> 