<template>
  <div class="free-traffic-analysis">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">免费流量分析</h3>
        <el-tag size="small" type="success">SEO</el-tag>
      </div>
      <div class="date-picker-section">
        <GSCDatePicker
          :startDate="localStartDate"
          :endDate="localEndDate"
          @update:startDate="localStartDate = $event"
          @update:endDate="localEndDate = $event"
          @change="handleDateChange"
        />
      </div>
    </div>

    <!-- 添加调试信息 -->
    <div v-if="datePerformanceData.length === 0" class="no-data">
      No overview data available
    </div>

    <GSCOverview 
      :overview-data="datePerformanceData"
      :loading="loading"
    />

    <el-tabs v-model="activeTab" class="custom-tabs">
      <el-tab-pane label="搜索词" name="query">
        <template #label>
          <span>搜索词</span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="页面" name="page">
        <template #label>
          <span>页面</span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="国家" name="country">
        <template #label>
          <span>国家</span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="设备" name="device">
        <template #label>
          <span>设备</span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="日期" name="date">
        <template #label>
          <span>日期</span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-table
      v-loading="loading"
      :data="paginatedData"
      style="width: 100%"
      :default-sort="{ prop: 'clicks', order: 'descending' }"
      class="custom-table"
    >
      <el-table-column
        prop="displayValue"
        :label="getColumnLabel()"
        min-width="300"
        show-overflow-tooltip
      />
      <el-table-column 
        prop="clicks" 
        label="点击次数" 
        min-width="120" 
        sortable 
        align="right"
      />
      <el-table-column
        prop="impressions"
        label="展示次数"
        min-width="120"
        sortable
        align="right"
      />
      <el-table-column 
        prop="ctr" 
        label="点击率" 
        min-width="100" 
        sortable 
        align="right"
      />
      <el-table-column 
        prop="position" 
        label="平均排名" 
        min-width="100" 
        sortable 
        align="right"
      />
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
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchSearchData } from '../api/gsc'
import { COUNTRY_CODES } from '../api/gsc'
import GSCOverview from './GSCOverview.vue'
import GSCDatePicker from './GSCDatePicker.vue'
import { getDefaultDateRange } from '../utils/dateUtils'

const props = defineProps({
  siteUrl: {
    type: String,
    required: true,
    default: import.meta.env.VITE_GSC_SITE_URL
  }
})

const activeTab = ref('query')
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)

// 使用本地的响应式变量
const localStartDate = ref('')
const localEndDate = ref('')

// 组件挂载时设置默认日期
onMounted(() => {
  const { startDate, endDate } = getDefaultDateRange()
  localStartDate.value = startDate
  localEndDate.value = endDate
  fetchData()
})

// 监听日期变化
watch([localStartDate, localEndDate], async ([newStart, newEnd], [oldStart, oldEnd]) => {
  if (newStart && newEnd && (newStart !== oldStart || newEnd !== oldEnd)) {
    loading.value = true
    try {
      await fetchData()
    } finally {
      loading.value = false
    }
  }
})

// 添加 total 计算属性
const total = computed(() => tableData.value.length)

// 计算分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end).map(item => ({
    ...item,
    position: typeof item.position === 'number' ? item.position.toFixed(2) : item.position
  }))
})

// 处理页码改变
const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 获取列标签
const getColumnLabel = () => {
  const labels = {
    query: '搜索词',
    page: '页面',
    country: '国家',
    device: '设备',
    date: '日期'
  }
  return labels[activeTab.value] || ''
}

// 获取数据
async function fetchData() {
  if (!localStartDate.value || !localEndDate.value) {
    console.warn('Invalid dates:', { startDate: localStartDate.value, endDate: localEndDate.value })
    return
  }

  loading.value = true
  try {
    const response = await fetchSearchData(localStartDate.value, localEndDate.value, activeTab.value)
    
    if (!response.rows || response.rows.length === 0) {
      tableData.value = []
      ElMessage.warning('所选日期范围内没有数据')
      return
    }

    tableData.value = response.rows.map(row => {
      let displayValue = row.keys[0]
      
      if (activeTab.value === 'country') {
        displayValue = COUNTRY_CODES[displayValue.toUpperCase()] || displayValue
      }

      return {
        displayValue,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: `${(row.ctr * 100).toFixed(2)}%`,  // 百分比格式化
        position: row.position.toFixed(2)  // 在这里已经格式化了位置
      }
    })
    currentPage.value = 1
  } catch (error) {
    console.error('Data fetch error:', error)
    ElMessage.error('数据获取失败，请重试')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 监听 Tab 变化
watch(activeTab, () => {
  fetchData()
})

// 处理每页条数改变
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 获取日期性能数据
const datePerformanceData = ref([])

// 获取日期性能数据
async function fetchDatePerformanceData() {
  if (!localStartDate.value || !localEndDate.value) return
  
  try {
    console.log('Fetching overview data for:', localStartDate.value, localEndDate.value)
    const response = await fetchSearchData(
      localStartDate.value,
      localEndDate.value,
      'date'
    )
    
    if (!response?.rows?.length) {
      console.warn('No overview data received')
      datePerformanceData.value = []
      return
    }

    // 确保数据格式正确
    datePerformanceData.value = response.rows.map(row => ({
      date: row.keys[0],
      clicks: Number(row.clicks),
      impressions: Number(row.impressions),
      ctr: Number(row.ctr),
      position: Number(row.position)
    }))
    
    console.log('Processed overview data:', datePerformanceData.value)
  } catch (error) {
    console.error('Date performance data fetch error:', error)
    ElMessage.error('获取日期性能数据失败')
    datePerformanceData.value = []
  }
}

// 处理日期变化
const handleDateChange = async () => {
  if (!localStartDate.value || !localEndDate.value) return
  
  loading.value = true
  try {
    console.log('Date changed, fetching new data...')
    await Promise.all([
      fetchDatePerformanceData(),
      fetchData()
    ])
  } finally {
    loading.value = false
  }
}

// 组件挂载时初始化数据
onMounted(async () => {
  const { startDate, endDate } = getDefaultDateRange()
  localStartDate.value = startDate
  localEndDate.value = endDate
  
  loading.value = true
  try {
    await Promise.all([
      fetchDatePerformanceData(),
      fetchData()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.free-traffic-analysis {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  position: relative;
}

.analysis-header {
  margin-bottom: var(--spacing-xl);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;  /* 与访问来源分析保持一致的间距 */
}

.analysis-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.title-tag {
  border: none;
  animation: pulse 2s infinite;
  margin-left: var(--spacing-md);
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

/* 自定义表格样式 */
:deep(.el-table) {
  background-color: transparent;
  color: var(--el-text-color-primary);  /* 使用主文本颜色 */
  border: none;
}

:deep(.el-table::before),
:deep(.el-table::after) {
  display: none;
}

/* 表头样式 */
:deep(.el-table th.el-table__cell) {
  background-color: transparent;
  border: none;
  color: var(--el-text-color-secondary);  /* 使用次要文本颜色 */
  font-weight: normal;
  padding: 8px 0;
}

/* 单元格样式 */
:deep(.el-table td.el-table__cell) {
  background-color: transparent;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);  /* 使用主文本颜色 */
  padding: 8px 0;
}

/* 斑马纹效果 */
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: var(--el-fill-color-light);
}

/* 悬停效果 */
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--el-fill-color) !important;
}

/* 表格行样式 */
:deep(.el-table .el-table__row) {
  background-color: transparent;
}

/* 数字列右对齐 */
:deep(.el-table .cell.numeric) {
  text-align: right;
}

/* 自定义 tabs 样式 */
:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--border-color);
}

:deep(.el-tabs__item) {
  color: var(--text-secondary);
  transition: all 0.3s;
}

:deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
}

:deep(.el-tabs__active-bar) {
  background-color: var(--primary-color);
  height: 3px;
  border-radius: 1.5px;
}

/* 分页样式 */
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
</style>