<template>
  <div class="free-traffic-analysis" v-loading="loading">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">免费流量分析</h3>
        <el-tag size="small" type="success">SEO</el-tag>
      </div>
    </div>

    <div class="metrics-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="6" v-for="metric in metricsData" :key="metric.key">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-content">
              <div class="metric-title">{{ metric.label }}</div>
              <div class="metric-value">{{ formatMetricValue(metric) }}</div>
              <div class="metric-trend" :class="getTrendClass(metric.trend)">
                {{ formatTrend(metric.trend) }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-tabs v-model="activeTab" class="traffic-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="搜索词" name="query">
        <el-table 
          :data="tableData" 
          style="width: 100%"
          @sort-change="handleSortChange"
        >
          <el-table-column 
            prop="query" 
            label="搜索词" 
            min-width="300"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ row.query || '(not set)' }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="clicks" 
            label="点击次数" 
            min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ formatNumber(row.clicks) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="impressions" 
            label="展示次数" 
            min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ formatNumber(row.impressions) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="ctr" 
            label="点击率" 
            min-width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ formatPercent(row.ctr) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="position" 
            label="平均排名" 
            min-width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ formatPosition(row.position) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="访问路径" name="path">
        <el-table 
          :data="tableData" 
          style="width: 100%"
          @sort-change="handleSortChange"
        >
          <el-table-column 
            prop="path" 
            label="页面路径" 
            min-width="300"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ row.path }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="clicks" 
            label="点击次数" 
            min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ formatNumber(row.clicks) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="impressions" 
            label="展示次数" 
            min-width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ formatNumber(row.impressions) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="ctr" 
            label="点击率" 
            min-width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ formatPercent(row.ctr) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="position" 
            label="平均排名" 
            min-width="100"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="table-cell-text">{{ formatPosition(row.position) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

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

    <el-empty v-if="!loading && tableData.length === 0" description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ga4Client } from '../api/ga4'
import { debounce } from 'lodash-es'
import { fetchGscData, testGSCSetup } from '../api/gsc'

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  siteUrl: {
    type: String,
    required: true
  }
})

const loading = ref(false)
const activeTab = ref('query')
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const metricsData = ref([])
const currentSort = ref({
  prop: 'clicks',
  order: 'descending'
})

// 修改 API URL，需要替换实际的网站 URL
const SITE_URL = encodeURIComponent('https://vertu.com');

// 处理 Tab 切换
const handleTabChange = () => {
  currentPage.value = 1
  fetchData()
}

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  currentSort.value = {
    prop: getOrderByField(prop),
    order: order || 'descending'
  }
  fetchData()
}

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

// 使用防抖处理搜索
const fetchData = debounce(async () => {
  if (!isValidDate(props.startDate) || !isValidDate(props.endDate)) {
    return
  }

  loading.value = true
  
  try {
    // 使用 Search Console API
    const searchConsoleRequest = {
      startDate: props.startDate,
      endDate: props.endDate,
      dimensions: activeTab.value === 'query' ? ['query'] : ['page'],
      rowLimit: pageSize.value,
      startRow: (currentPage.value - 1) * pageSize.value,
      // 根据当前排序设置
      orderBy: [{
        field: currentSort.value.prop || 'clicks',
        sortOrder: currentSort.value.order === 'descending' ? 'desc' : 'asc'
      }]
    }

    // 调用 Search Console API - 这里需要修改
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${SITE_URL}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${props.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchConsoleRequest)
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || '请求失败')
    }

    if (data.rows) {
      tableData.value = data.rows.map(row => ({
        query: activeTab.value === 'query' ? row.keys[0] : null,
        path: activeTab.value === 'path' ? row.keys[0] : null,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,  // 已经是小数形式，不需要乘 100
        position: row.position
      }))

      total.value = data.totalRows || data.rows.length
      updateMetricsData(data)
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('Error fetching Search Console data:', error)
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}, 300)

// 检查日期是否有效
const isValidDate = (dateStr) => {
  if (!dateStr) return false
  if (typeof dateStr !== 'string') return false
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return false
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date)
}

// 获取排序字段
const getOrderByField = (field) => {
  // Search Console API 的排序字段
  const validFields = ['clicks', 'impressions', 'ctr', 'position']
  return validFields.includes(field) ? field : 'clicks'
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

// 格式化百分比
const formatPercent = (value) => {
  if (!value && value !== 0) return '-'
  return `${value.toFixed(1)}%`
}

// 格式化排名
const formatPosition = (value) => {
  if (!value && value !== 0) return '-'
  return value.toFixed(1)
}

// 更新概览数据
const updateMetricsData = (data) => {
  metricsData.value = [
    {
      key: 'clicks',
      label: '总点击',
      value: data.totals?.clicks || 0,
      type: 'number',
      trend: calculateTrend(data, 'clicks')
    },
    {
      key: 'impressions',
      label: '总展示',
      value: data.totals?.impressions || 0,
      type: 'number',
      trend: calculateTrend(data, 'impressions')
    },
    {
      key: 'ctr',
      label: '平均点击率',
      value: data.totals?.ctr || 0,
      type: 'percent',
      trend: calculateTrend(data, 'ctr')
    },
    {
      key: 'position',
      label: '平均排名',
      value: data.totals?.position || 0,
      type: 'position',
      trend: calculateTrend(data, 'position')
    }
  ]
}

// 计算趋势
const calculateTrend = (data, metric) => {
  // 实现趋势计算逻辑
  return 0
}

// 格式化概览数据
const formatMetricValue = (metric) => {
  switch (metric.type) {
    case 'number':
      return formatNumber(metric.value)
    case 'percent':
      return formatPercent(metric.value)
    case 'position':
      return formatPosition(metric.value)
    default:
      return metric.value
  }
}

// 格式化趋势
const formatTrend = (trend) => {
  if (trend === 0) return '持平'
  if (trend > 0) return '上升'
  if (trend < 0) return '下降'
}

// 获取趋势类
const getTrendClass = (trend) => {
  if (trend === 0) return 'neutral'
  if (trend > 0) return 'up'
  if (trend < 0) return 'down'
}

// 监听日期变化
watch(
  [() => props.startDate, () => props.endDate],
  ([newStart, newEnd]) => {
    if (isValidDate(newStart) && isValidDate(newEnd)) {
      currentPage.value = 1
      fetchData()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  try {
    const authSuccess = await testGSCSetup()
    if (!authSuccess) {
      ElMessage.error('Search Console API 认证失败')
      return
    }
    
    if (isValidDate(props.startDate) && isValidDate(props.endDate)) {
      fetchData()
    }
  } catch (error) {
    console.error('Setup error:', error)
    ElMessage.error('初始化失败')
  }
})
</script>

<style scoped>
.free-traffic-analysis {
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

.metrics-overview {
  margin-bottom: 24px;
}

.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
}

.metric-content {
  text-align: center;
}

.metric-title {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.metric-value {
  color: var(--text-color);
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}
 
.table-cell-text {
  color: var(--text-color);
  font-weight: normal;
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

@media (max-width: 768px) {
  .free-traffic-analysis {
    padding: 16px;
  }

  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .metrics-overview {
    margin-bottom: 16px;
  }
}
</style> 