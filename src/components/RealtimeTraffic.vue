<template>
  <div class="realtime-traffic">
    <div class="metrics-container" v-loading="loading">
      <div class="overview-row">
        <ActiveUsersCard 
          :last30-min-users="last29Min"
          :last5-min-users="last5Min"
          :time-series-data="timeSeriesData"
          :last-update-time="lastUpdateTime"
          @refresh="fetchData"
          class="!border-none"
        />
      </div>

      <div class="stats-row">
        <PageViewsCard 
          :page-views-data="pageViewsData"
          :last-update-time="lastUpdateTime"
          @refresh="fetchData"
          class="!border-none"
        />
        <EventsCard 
          :events-data="eventsData"
          :last-update-time="lastUpdateTime"
          @refresh="fetchData"
          class="!border-none"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ActiveUsersCard from './cards/ActiveUsersCard.vue'
import PageViewsCard from './cards/PageViewsCard.vue'
import EventsCard from './cards/EventsCard.vue'
import { fetchRealtimeTraffic } from '../api/ga4'
import dayjs from 'dayjs'

// 初始化所有需要的响应式数据
const loading = ref(false)
const lastUpdateTime = ref('')
const timeSeriesData = ref([])
const last5Min = ref(0)
const last29Min = ref(0)
const pageViewsData = ref([])
const eventsData = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const response = await fetchRealtimeTraffic()
    console.log('原始数据:', response)

    // 处理时间序列数据
    if (response?.timeSeriesData?.rows) {
      // 按分钟数升序排序（从最早的时间开始）
      const sortedData = [...response.timeSeriesData.rows]
        .sort((a, b) => {
          return parseInt(a.dimensionValues[0].value) - parseInt(b.dimensionValues[0].value)
        })
        .slice(0, 30) // 确保最多30条数据

      // 更新图表数据（反转数组，使其从大到小排序）
      timeSeriesData.value = sortedData
        .map(row => ({
          time: `${row.dimensionValues[0].value}分钟前`,
          value: parseInt(row.metricValues[0].value)
        }))
        .reverse() // 反转数组，使时间从大到小排序

      // 计算最近5分钟活跃用户
      const last5MinData = sortedData.filter(row => parseInt(row.dimensionValues[0].value) <= 5)
      last5Min.value = last5MinData.reduce((sum, row) => {
        return sum + parseInt(row.metricValues[0].value)
      }, 0)

      // 计算最近30分钟活跃用户
      last29Min.value = sortedData.reduce((sum, row) => {
        return sum + parseInt(row.metricValues[0].value)
      }, 0)
    }

    // 处理页面浏览数据
    if (response?.pageViewsData?.rows) {
      pageViewsData.value = response.pageViewsData.rows
    }

    // 处理事件数据
    if (response?.eventsData?.rows) {
      eventsData.value = response.eventsData.rows
    }

    lastUpdateTime.value = dayjs().format('HH:mm:ss')
  } catch (error) {
    console.error('数据获取失败:', error)
    // 重置所有数据
    timeSeriesData.value = []
    last5Min.value = 0
    last29Min.value = 0
    pageViewsData.value = []
    eventsData.value = []
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchData()
})

// 设置定时刷新
const startAutoRefresh = () => {
  const refreshInterval = setInterval(fetchData, 60000) // 每60秒刷新一次
  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
}

startAutoRefresh()
</script>

<style lang="scss" scoped>
.realtime-traffic {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.metrics-container {
  margin-bottom: 24px;

  :deep(.el-loading-mask) {
    background-color: var(--el-mask-color);
    .el-loading-spinner {
      .circular {
        .path {
          stroke: var(--el-color-primary);
        }
      }
    }
  }
}

.overview-row,
.stats-row {
  margin-bottom: 24px;

  :deep(.el-card) {
    background-color: var(--el-bg-color);
    color: var(--el-text-color-primary);
    border: none;

    .el-card__header {
      border-bottom-color: var(--el-border-color-light);
    }
  }

  :deep(.el-table) {
    background-color: var(--el-bg-color);
    color: var(--el-text-color-primary);

    th, td {
      background-color: var(--el-bg-color);
      color: var(--el-text-color-primary);
      border-bottom-color: var(--el-border-color-light);
    }

    tr:hover > td {
      background-color: var(--el-bg-color-darker);
    }
  }
}

.stats-row {
  display: flex;
  gap: 24px;

  > * {
    flex: 1;
  }
}

@media (max-width: 1280px) {
  .stats-row {
    flex-direction: column;
  }
}
</style> 