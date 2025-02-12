<template>
  <div class="source-analysis" v-loading="loading">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">访问来源分析</h3>
        <el-tag size="small" type="warning">来源</el-tag>
      </div>
    </div>

    <div class="source-table">
      <el-table 
        :data="sourceData" 
        style="width: 100%"
        @sort-change="handleSortChange"
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
          prop="sourceMedium" 
          label="来源/媒介" 
          min-width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ row.sourceMedium }}</span>
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
          prop="bounceRate" 
          label="跳出率" 
          min-width="100"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="table-cell-text">{{ formatPercent(row.bounceRate) }}</span>
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
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { Search, Share, Link, Position } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ga4Client } from '../api/ga4'

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

const sourceData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const currentSort = ref({
  prop: 'users',
  order: 'descending'
})

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
const getOrderByField = (prop) => {
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
    case 'sourceMedium':
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
    console.log('TrafficSource fetching with dates:', props.startDate, props.endDate)

    const report = {
      dateRanges: [{ 
        startDate: props.startDate, 
        endDate: props.endDate 
      }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      orderBys: [
        {
          ...getOrderByField(currentSort.value.prop),
          desc: currentSort.value.order === 'descending'
        }
      ],
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    }

    console.log('TrafficSource API request:', report)
    const response = await ga4Client.runReport(report)
    console.log('TrafficSource API response:', response)

    sourceData.value = response.rows.map(row => ({
      type: getSourceType(row.dimensionValues[0].value),
      source: row.dimensionValues[0].value,
      sourceMedium: `${row.dimensionValues[0].value}/${row.dimensionValues[1].value}`,
      campaign: row.dimensionValues[2].value,
      visits: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
      bounceRate: parseFloat(row.metricValues[2].value),
      avgDuration: parseFloat(row.metricValues[3].value)
    }))

    total.value = response.rowCount || 0

  } catch (error) {
    console.error('Error fetching traffic source data:', error)
    ElMessage.error('获取数据失败')
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
  if (!seconds) return '0秒'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return `${seconds}秒`
  return `${minutes}分${seconds % 60}秒`
}

// 获取趋势样式
const getTrendClass = (value) => {
  if (!value) return ''
  return value > 0 ? 'trend-up' : 'trend-down'
}

// 获取来源类型
const getSourceType = (source) => {
  source = source.toLowerCase()
  if (source.includes('google') || source.includes('baidu') || source.includes('bing')) return 'search'
  if (source.includes('facebook') || source.includes('twitter') || source.includes('linkedin')) return 'social'
  if (source === '(direct)') return 'direct'
  return 'referral'
}

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  console.log('Sort changed:', { prop, order })
  
  if (!prop || !order) {
    currentSort.value = {
      prop: 'users',
      order: 'descending'
    }
  } else {
    currentSort.value = { prop, order }
  }
  
  currentPage.value = 1
  fetchData()
}
</script>

<style scoped>
.source-analysis {
  padding: 24px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
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
</style> 