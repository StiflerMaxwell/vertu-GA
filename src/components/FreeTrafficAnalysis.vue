<template>
  <div class="free-traffic-analysis" v-loading="loading">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">免费流量分析</h3>
        <el-tag size="small" type="success">SEO</el-tag>
      </div>
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
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
  },
  accessToken: {
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
const currentSort = ref({
  prop: 'clicks',
  order: 'descending'
})

// 处理 Tab 切换
const handleTabChange = (tab) => {
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

// 获取数据
async function fetchData() {
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

    // 调用 Search Console API
    const response = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites/siteUrl/searchAnalytics/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${props.accessToken}`,  // 需要从 props 或 store 获取
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchConsoleRequest)
      }
    )

    const data = await response.json()
    console.log('Search Console response:', data)

    if (data.rows) {
      tableData.value = data.rows.map(row => ({
        query: activeTab.value === 'query' ? row.keys[0] : null,
        path: activeTab.value === 'path' ? row.keys[0] : null,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr * 100,  // 转换为百分比
        position: row.position
      }))

      total.value = data.totalRows || data.rows.length
    } else {
      tableData.value = []
      total.value = 0
    }

  } catch (error) {
    console.error('Error fetching Search Console data:', error)
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
  return `${(value * 100).toFixed(1)}%`
}

// 格式化排名
const formatPosition = (value) => {
  if (!value && value !== 0) return '-'
  return value.toFixed(1)
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

onMounted(() => {
  if (isValidDate(props.startDate) && isValidDate(props.endDate)) {
    fetchData()
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
}
</style> 