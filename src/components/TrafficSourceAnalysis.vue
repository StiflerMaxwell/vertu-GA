<template>
  <div class="source-analysis" v-loading="loading">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">访问来源分析</h3>
        <el-tag size="small" type="warning">来源</el-tag>
      </div>
      
      <!-- 添加搜索框 -->
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索来源/媒介/活动"
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="source-table">
      <el-table 
        :data="sourceData" 
        style="width: 100%"
        @sort-change="handleSourceSortChange"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column 
          prop="source" 
          label="来源" 
          min-width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            <div class="source-info">
              <el-icon :size="20" :class="row.type">
                <component :is="getSourceIcon(row.type)" />
              </el-icon>
              <span class="table-cell-text">{{ row.source }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column 
          prop="medium" 
          label="媒介" 
          min-width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ row.medium }}</span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="campaign" 
          label="活动" 
          min-width="150"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ row.campaign || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="visits" 
          label="访问量" 
          min-width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ formatNumber(row.visits) }}</span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="users" 
          label="访客数" 
          min-width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ formatNumber(row.users) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="bounceRate" 
          label="跳出率" 
          min-width="100"
          sortable="custom"
        >
          <template #default="{ row }">
            <span 
              class="table-cell-text"
              :class="{ 'warning-text': row.bounceRate > 0.7 }"
            >
              {{ formatPercent(row.bounceRate) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="avgDuration" 
          label="平均访问时长" 
          min-width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ formatDuration(row.avgDuration) }}</span>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>

  <!-- 新增页面分析 -->
  <div class="page-analysis" v-loading="pageLoading">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">页面分析</h3>
        <el-tag size="small" type="success">页面</el-tag>
      </div>
      
      <div class="search-section">
        <el-input
          v-model="pageSearchKeyword"
          placeholder="搜索页面路径"
          :prefix-icon="Search"
          clearable
          @input="handlePageSearch"
        />
      </div>
    </div>

    <div class="page-table">
      <el-table 
        :data="pageData" 
        style="width: 100%"
        @sort-change="handlePageSortChange"
        show-summary
        :summary-method="getPageSummaries"
      >
        <el-table-column 
          prop="pagePath" 
          label="页面路径" 
          min-width="300"
          sortable="custom"
        >
          <template #default="{ row }">
            <div class="page-info">
              <el-link
                :href="`https://vertu.com${row.pagePath}`"
                type="primary"
                target="_blank"
                class="page-link"
              >
                {{ row.pagePath }}
              </el-link>
            </div>
          </template>
        </el-table-column>

        <el-table-column 
          prop="pageTitle" 
          label="页面标题" 
          min-width="200"
          sortable="custom"
        >
          <template #default="{ row }">
            <el-tooltip
              :content="row.pageTitle"
              placement="top"
              :show-after="500"
              max-width="300"
            >
              <span class="truncate-text">{{ row.pageTitle }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column 
          prop="pageviews" 
          label="浏览量" 
          min-width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ row.pageviews }}</span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="uniquePageviews" 
          label="独立浏览量" 
          min-width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ row.uniquePageviews }}</span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="bounceRate" 
          label="跳出率" 
          min-width="100"
          sortable="custom"
        >
          <template #default="{ row }">
            <span 
              class="table-cell-text"
              :class="{ 'warning-text': row.bounceRate > 0.7 }"
            >
              {{ formatPercent(row.bounceRate) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="avgTimeOnPage" 
          label="平均停留时长" 
          min-width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            <span 
              class="table-cell-text"
              :class="{ 'warning-text': row.avgTimeOnPage < 30 }"
            >
              {{ formatDuration(row.avgTimeOnPage) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pageCurrentPage"
          v-model:page-size="pagePageSize"
          :page-sizes="[20, 50, 100]"
          :total="pageTotal"
          layout="total, sizes, prev, pager, next"
          @size-change="handlePageSizeChange"
          @current-change="handlePageCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { Search, Share, Link, Position } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ga4Client } from '../api/ga4'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  }
})

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const sourceCurrentSort = ref({
  prop: 'visits',
  order: 'descending'
})

const searchKeyword = ref('')
const sourceData = ref([])

// 添加总计数据的 ref
const totals = ref({
  visits: 0,
  users: 0,
  bounceRate: 0,
  avgDuration: 0
})

// 使用防抖来避免频繁请求
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1  // 重置页码
  fetchData()
}, 300)

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchData()
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchData()
}

// 获取 GA4 API 对应的字段名
const getSourceOrderByField = (prop) => {
  switch (prop) {
    case 'visits':
      return { metric: { metricName: 'screenPageViews' } }
    case 'users':
      return { metric: { metricName: 'totalUsers' } }
    case 'bounceRate':
      return { metric: { metricName: 'bounceRate' } }
    case 'avgDuration':
      return { metric: { metricName: 'averageSessionDuration' } }
    case 'source':
      return { dimension: { dimensionName: 'sessionSource' } }
    case 'medium':
      return { dimension: { dimensionName: 'sessionMedium' } }
    case 'campaign':
      return { dimension: { dimensionName: 'sessionCampaignName' } }
    default:
      return { metric: { metricName: 'screenPageViews' } }
  }
}

// 获取数据
async function fetchData() {
  if (!isValidDate(props.startDate) || !isValidDate(props.endDate)) {
    console.log('Waiting for valid dates...')
    return
  }

  loading.value = true
  
  try {
    // 构建基础请求体
    const baseRequest = {
      dateRanges: [{
        startDate: props.startDate,
        endDate: props.endDate
      }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ]
    }

    // 添加搜索条件
    const dimensionFilter = searchKeyword.value ? {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'sessionSource',
              stringFilter: {
                matchType: 'CONTAINS',
                value: searchKeyword.value,
                caseSensitive: false
              }
            }
          },
          {
            filter: {
              fieldName: 'sessionMedium',
              stringFilter: {
                matchType: 'CONTAINS',
                value: searchKeyword.value,
                caseSensitive: false
              }
            }
          },
          {
            filter: {
              fieldName: 'sessionCampaignName',
              stringFilter: {
                matchType: 'CONTAINS',
                value: searchKeyword.value,
                caseSensitive: false
              }
            }
          }
        ]
      }
    } : undefined

    // 分页数据请求
    const pageRequest = {
      ...baseRequest,
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' }
      ],
      dimensionFilter,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
      orderBys: [{
        ...getSourceOrderByField(sourceCurrentSort.value.prop),
        desc: sourceCurrentSort.value.order === 'descending'
      }]
    }

    // 总计数据请求（使用相同的筛选条件但不分页）
    const totalRequest = {
      ...baseRequest,
      dimensionFilter,
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' }
      ]
    }

    // 并行请求数据
    const [pageResponse, totalResponse] = await Promise.all([
      ga4Client.runReport(pageRequest),
      ga4Client.runReport(totalRequest)
    ])

    // 处理分页数据
    if (pageResponse?.rows?.length) {
      sourceData.value = pageResponse.rows.map(row => {
        const source = row.dimensionValues[0].value
        const medium = row.dimensionValues[1].value
        const campaign = row.dimensionValues[2].value
        
        return {
          type: getSourceType(source),
          source: source,
          medium: medium,
          sourceMedium: `${source}/${medium}`,
          campaign: campaign === '(not set)' ? '-' : campaign,
          visits: parseInt(row.metricValues[0].value),
          users: parseInt(row.metricValues[1].value),
          bounceRate: parseFloat(row.metricValues[2].value),
          avgDuration: parseFloat(row.metricValues[3].value)
        }
      })
    } else {
      sourceData.value = []
    }

    // 计算总计数据
    if (totalResponse?.rows?.length) {
      const totalVisits = totalResponse.rows.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0)
      const totalUsers = totalResponse.rows.reduce((sum, row) => sum + parseInt(row.metricValues[1].value), 0)
      
      // 计算加权平均的跳出率和访问时长
      const weightedBounceRate = totalResponse.rows.reduce((sum, row) => {
        const users = parseInt(row.metricValues[1].value)
        return sum + parseFloat(row.metricValues[2].value) * users
      }, 0) / totalUsers

      const weightedDuration = totalResponse.rows.reduce((sum, row) => {
        const users = parseInt(row.metricValues[1].value)
        return sum + parseFloat(row.metricValues[3].value) * users
      }, 0) / totalUsers

      totals.value = {
        visits: totalVisits,
        users: totalUsers,
        bounceRate: weightedBounceRate,
        avgDuration: weightedDuration
      }
    }

    total.value = pageResponse.rowCount || 0

  } catch (error) {
    console.error('Error fetching source data:', error)
    ElMessage.error('获取来源数据失败')
    sourceData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 检查日期是否有效
const isValidDate = (dateStr) => {
  if (!dateStr) return false
  if (typeof dateStr !== 'string') return false
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return false
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date)
}

// 监听日期变化
watch(
  [() => props.startDate, () => props.endDate],
  ([newStart, newEnd], [oldStart, oldEnd]) => {
    console.log('TrafficSource dates changed:', {
      newStart,
      newEnd,
      oldStart,
      oldEnd
    })
    
    if (isValidDate(newStart) && isValidDate(newEnd)) {
      console.log('TrafficSource valid dates detected, fetching data...')
      currentPage.value = 1 // 重置页码
      fetchData()
    } else {
      console.log('TrafficSource invalid or empty dates, skipping fetch')
    }
  },
  { immediate: true }
)

// 组件挂载时初始化数据
onMounted(() => {
  if (isValidDate(props.startDate) && isValidDate(props.endDate)) {
    console.log('TrafficSource mounted, fetching initial data...')
    fetchData()
  }
})

// 获取来源图标
const getSourceIcon = (type) => {
  switch (type) {
    case 'search':
      return Search
    case 'social':
      return Share
    case 'referral':
      return Link
    default:
      return Position
  }
}

// 格式化数字
const formatNumber = (value) => {
  if (!value && value !== 0) return '-'
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return value.toLocaleString()
}

// 格式化趋势
const formatTrend = (value) => {
  if (!value && value !== 0) return '0%'
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

// 格式化百分比
const formatPercent = (value) => {
  if (!value && value !== 0) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '0秒'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return `${Math.round(seconds)}秒`
  return `${minutes}分${Math.round(seconds % 60)}秒`
}

// 获取趋势样式
const getTrendClass = (value) => {
  if (!value) return ''
  return value > 0 ? 'trend-up' : 'trend-down'
}

// 获取来源类型
const getSourceType = (source = '') => {
  source = source.toLowerCase()
  if (source.includes('google') || source.includes('bing') || source.includes('yandex')) return 'search'
  if (source.includes('facebook') || source.includes('fb') || source.includes('instagram') || source === 'm.facebook.com') return 'social'
  if (source === '(direct)') return 'direct'
  return 'referral'
}

// 处理排序变化
const handleSourceSortChange = ({ prop, order }) => {
  console.log('Source sort changed:', { prop, order })
  
  if (!prop || !order) {
    sourceCurrentSort.value = {
      prop: 'visits',
      order: 'descending'
    }
  } else {
    sourceCurrentSort.value = { prop, order }
  }
  
  currentPage.value = 1
  fetchData()
}

// 处理搜索
const handleSearch = () => {
  debouncedSearch()
}

// 监听搜索关键词变化
watch(searchKeyword, () => {
  handleSearch()
})

// 修改总计计算方法使用 API 返回的总计数据
const getSummaries = (param) => {
  const { columns } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '总计'
      return
    }
    
    switch (column.property) {
      case 'visits':
        sums[index] = formatNumber(totals.value.visits)
        break
      case 'users':
        sums[index] = formatNumber(totals.value.users)
        break
      case 'bounceRate':
        sums[index] = formatPercent(totals.value.bounceRate)
        break
      case 'avgDuration':
        sums[index] = formatDuration(totals.value.avgDuration)
        break
      default:
        sums[index] = ''
    }
  })
  
  return sums
}

// 页面分析相关的状态
const pageLoading = ref(false)
const pageCurrentPage = ref(1)
const pagePageSize = ref(20)
const pageTotal = ref(0)
const pageSearchKeyword = ref('')
const pageData = ref([])
const pageTotals = ref({
  pageviews: 0,
  uniquePageviews: 0,
  bounceRate: 0,
  avgTimeOnPage: 0
})

// 页面排序状态
const pageCurrentSort = ref({
  prop: 'pageviews',
  order: 'descending'
})

// 获取 GA4 API 对应的字段名
const getPageOrderByField = (prop) => {
  switch (prop) {
    case 'pageviews':
      return { metric: { metricName: 'screenPageViews' } }
    case 'uniquePageviews':
      return { metric: { metricName: 'totalUsers' } }
    case 'bounceRate':
      return { metric: { metricName: 'bounceRate' } }
    case 'avgTimeOnPage':
      return { metric: { metricName: 'averageSessionDuration' } }
    case 'pagePath':
      return { dimension: { dimensionName: 'pagePath' } }
    case 'pageTitle':
      return { dimension: { dimensionName: 'pageTitle' } }
    default:
      return { metric: { metricName: 'screenPageViews' } }
  }
}

// 获取页面数据
async function fetchPageData() {
  if (!isValidDate(props.startDate) || !isValidDate(props.endDate)) {
    return
  }

  pageLoading.value = true
  
  try {
    const baseRequest = {
      dateRanges: [{
        startDate: props.startDate,
        endDate: props.endDate
      }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ]
    }

    // 添加搜索条件
    const dimensionFilter = pageSearchKeyword.value ? {
      filter: {
        fieldName: 'pagePath',
        stringFilter: {
          matchType: 'CONTAINS',
          value: pageSearchKeyword.value,
          caseSensitive: false
        }
      }
    } : undefined

    // 分页请求
    const pageRequest = {
      ...baseRequest,
      dimensionFilter,
      limit: pagePageSize.value,
      offset: (pageCurrentPage.value - 1) * pagePageSize.value,
      orderBys: [{
        ...getPageOrderByField(pageCurrentSort.value.prop),
        desc: pageCurrentSort.value.order === 'descending'
      }]
    }

    // 总计请求
    const totalRequest = {
      ...baseRequest,
      dimensionFilter
    }

    const [pageResponse, totalResponse] = await Promise.all([
      ga4Client.runReport(pageRequest),
      ga4Client.runReport(totalRequest)
    ])

    // 处理页面数据
    if (pageResponse?.rows?.length) {
      pageData.value = pageResponse.rows.map(row => ({
        pagePath: row.dimensionValues[0].value,
        pageTitle: row.dimensionValues[1].value,
        pageviews: parseInt(row.metricValues[0].value),
        uniquePageviews: parseInt(row.metricValues[1].value),
        bounceRate: parseFloat(row.metricValues[2].value),
        avgTimeOnPage: parseFloat(row.metricValues[3].value)
      }))
    } else {
      pageData.value = []
    }

    // 计算总计
    if (totalResponse?.rows?.length) {
      const totalPageviews = totalResponse.rows.reduce((sum, row) => 
        sum + parseInt(row.metricValues[0].value), 0)
      const totalUniquePageviews = totalResponse.rows.reduce((sum, row) => 
        sum + parseInt(row.metricValues[1].value), 0)
      
      // 计算加权平均
      const weightedBounceRate = totalResponse.rows.reduce((sum, row) => {
        const views = parseInt(row.metricValues[0].value)
        return sum + parseFloat(row.metricValues[2].value) * views
      }, 0) / totalPageviews

      const weightedTimeOnPage = totalResponse.rows.reduce((sum, row) => {
        const views = parseInt(row.metricValues[0].value)
        return sum + parseFloat(row.metricValues[3].value) * views
      }, 0) / totalPageviews

      pageTotals.value = {
        pageviews: totalPageviews,
        uniquePageviews: totalUniquePageviews,
        bounceRate: weightedBounceRate,
        avgTimeOnPage: weightedTimeOnPage
      }
    }

    pageTotal.value = pageResponse.rowCount || 0
  } catch (error) {
    console.error('Error fetching page data:', error)
    ElMessage.error('获取页面数据失败')
    pageData.value = []
    pageTotal.value = 0
  } finally {
    pageLoading.value = false
  }
}

// 页面相关的处理函数
const handlePageSearch = useDebounceFn(() => {
  pageCurrentPage.value = 1
  fetchPageData()
}, 300)

// 处理页面排序变化
const handlePageSortChange = ({ prop, order }) => {
  console.log('Page sort changed:', { prop, order })
  
  if (!prop || !order) {
    pageCurrentSort.value = {
      prop: 'pageviews',
      order: 'descending'
    }
  } else {
    pageCurrentSort.value = { prop, order }
  }
  
  pageCurrentPage.value = 1
  fetchPageData()
}

const handlePageSizeChange = (size) => {
  pagePageSize.value = size
  pageCurrentPage.value = 1
  fetchPageData()
}

const handlePageCurrentChange = (page) => {
  pageCurrentPage.value = page
  fetchPageData()
}

const getPageSummaries = (param) => {
  const { columns } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '总计'
      return
    }
    
    switch (column.property) {
      case 'pageviews':
        sums[index] = pageTotals.value.pageviews
        break
      case 'uniquePageviews':
        sums[index] = pageTotals.value.uniquePageviews
        break
      case 'bounceRate':
        sums[index] = formatPercent(pageTotals.value.bounceRate)
        break
      case 'avgTimeOnPage':
        sums[index] = formatDuration(pageTotals.value.avgTimeOnPage)
        break
      default:
        sums[index] = ''
    }
  })
  
  return sums
}

// 监听日期变化时同时更新页面数据
watch(
  [() => props.startDate, () => props.endDate],
  ([newStart, newEnd]) => {
    if (isValidDate(newStart) && isValidDate(newEnd)) {
      fetchPageData()
    }
  }
)

// 初始化时加载页面数据
onMounted(() => {
  if (isValidDate(props.startDate) && isValidDate(props.endDate)) {
    fetchPageData()
  }
})
</script>

<style scoped>
.source-analysis {
  width: 100%;
  height: 100%;
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

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.source-table {
  position: relative;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.source-info .el-icon {
  padding: 6px;
  border-radius: 8px;
  background: var(--hover-bg);
}

.source-info .search {
  color: var(--primary-color);
}

.source-info .social {
  color: var(--success-color);
}

.source-info .referral {
  color: var(--warning-color);
}

.source-info .direct {
  color: var(--info-color);
}

.table-cell-text {
  color: var(--text-color);
  font-weight: normal;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

:deep(.el-pagination) {
  --el-pagination-bg-color: var(--card-bg);
  --el-pagination-hover-color: var(--primary-color);
  --el-pagination-button-bg-color: var(--card-bg);
  --el-pagination-button-color: var(--text-color);
  --el-pagination-button-disabled-color: var(--text-secondary);
}

:deep(.el-pagination .el-select .el-input) {
  width: 110px;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

:deep(.el-table) {
  width: 100% !important;
  height: 100%;
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: var(--card-bg);
  --el-table-row-hover-bg-color: var(--hover-bg);
  --el-table-header-text-color: var(--text-secondary);
  --el-table-text-color: var(--text-color);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: var(--card-bg);
  font-weight: 500;
  color: var(--text-secondary);
}

:deep(.el-table td) {
  background-color: var(--card-bg);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: var(--hover-bg);
}

:deep(.el-table .cell) {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .source-analysis {
    padding: 16px;
  }

  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .source-table {
    margin-top: 12px;
    overflow-x: auto;
  }
}

:deep(.el-table th.is-sortable) {
  cursor: pointer;
}

:deep(.el-table th.ascending .sort-caret.ascending) {
  border-bottom-color: var(--primary-color);
}

:deep(.el-table th.descending .sort-caret.descending) {
  border-top-color: var(--primary-color);
}

.search-section {
  width: 300px; /* 或者其他合适的宽度 */
}

:deep(.el-input__wrapper) {
  background-color: var(--el-bg-color);
}

:deep(.el-input__inner) {
  color: var(--el-text-color-primary);
}

:deep(.el-input__prefix-inner) {
  color: var(--el-text-color-secondary);
}

:deep(.el-table__footer-wrapper) {
  background-color: var(--card-bg);
}

:deep(.el-table__footer) {
  background-color: var(--card-bg);
  color: var(--text-color);
  font-weight: 600;
}

:deep(.el-table__footer td) {
  background-color: var(--card-bg);
  border-top: 1px solid var(--border-color);
}

:deep(.el-table__footer .cell) {
  padding: 12px 0;
}

.page-analysis {
  margin-top: 24px;
  width: 100%;
  height: 100%;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-link {
  /* 确保长链接不会破坏布局 */
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 自定义链接颜色以匹配主题 */
:deep(.el-link.el-link--primary) {
  color: var(--el-color-primary);
}

:deep(.el-link.el-link--primary:hover) {
  color: var(--el-color-primary-light-3);
}

.warning-text {
  color: var(--el-color-danger);
  font-weight: bold;
}

/* 可选：添加闪烁动画效果 */
@keyframes warning-flash {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.warning-text {
  animation: warning-flash 2s infinite;
}

.truncate-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 可选：添加鼠标悬停样式 */
.truncate-text:hover {
  color: var(--el-color-primary);
  cursor: pointer;
}
</style> 