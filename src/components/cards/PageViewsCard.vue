<template>
  <el-card class="page-views-card !border-none">
    <template #header>
      <div class="card-header">
        <span class="title">实时页面浏览</span>
      </div>
    </template>

    <el-table 
      :data="tableData" 
      style="width: 100%" 
      :max-height="400"
    >
      <el-table-column prop="pageName" label="页面名称" min-width="180">
        <template #default="{ row }">
          <span class="page-name">{{ formatPageName(row.pageName) }}</span>
        </template>
      </el-table-column>
      <el-table-column 
        prop="pageViews" 
        label="浏览量" 
        width="150" 
        align="right"
        sortable
      />
      <el-table-column 
        prop="activeUsers" 
        label="活跃用户" 
        width="150" 
        align="right"
        sortable
      />
    </el-table>

    <div v-if="!tableData || tableData.length === 0" class="no-data">
      暂无数据
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'

const props = defineProps({
  pageViewsData: {
    type: Array,
    default: () => []
  },
  lastUpdateTime: {
    type: String,
    default: ''
  }
})

const pageSize = 6
const currentPage = ref(1)

// 重置页码当数据变化时
watchEffect(() => {
  if (props.pageViewsData) {
    currentPage.value = 1
  }
})

const tableData = computed(() => {
  return props.pageViewsData.map(item => ({
    pageName: item.dimensionValues?.[0]?.value?.replace(/https?:\/\/[^\/]+/i, '') || '',
    pageViews: parseInt(item.metricValues?.[0]?.value) || 0,
    activeUsers: parseInt(item.metricValues?.[1]?.value) || 0
  }))
})

const formatPageName = (pageName) => {
  if (!pageName) return '-'
  return pageName.replace(/\| VERTU® Official Site/gi, '')
}

const processedData = computed(() => {
  console.log('Processing data:', props.pageViewsData)
  if (!props.pageViewsData?.length) return []
  
  return props.pageViewsData
    .map(row => ({
      title: row.dimensionValues?.[0]?.value || '',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0')
    }))
    .filter(item => item.title && (item.views > 0 || item.users > 0))
    .sort((a, b) => b.views - a.views)
})

const totalItems = computed(() => processedData.value.length)

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))

const currentPageData = computed(() => {
  console.log('Current page data:', processedData.value)
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return processedData.value.slice(startIndex, endIndex)
})

const handlePageChange = (page) => {
  currentPage.value = page
}
</script>

<style lang="scss" scoped>
.page-views-card {
  :deep(.el-card) {
    background-color: var(--bg-primary);
    border: none;
    
    .el-card__body {
      padding: 0;
      background-color: var(--bg-primary);
    }

    .el-card__header {
      padding: 12px 16px;
      background-color: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
    }
  }

  :deep(.el-table) {
    --el-table-border-color: var(--border-color);
    --el-table-header-bg-color: var(--bg-primary);
    --el-table-row-hover-bg-color: var(--bg-secondary);
    
    th {
      background-color: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-weight: 600;
      padding: 8px 12px;
      height: 40px;
      line-height: 24px;
    }

    td {
      border-bottom: 1px solid var(--border-color);
      padding: 8px 12px;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      height: 40px;
      line-height: 24px;
    }

    .el-table__row {
      background-color: var(--bg-primary);
      
      &:hover > td {
        background-color: var(--bg-secondary);
      }
    }

    .cell {
      line-height: 24px;
    }
  }

  .page-link {
    color: var(--primary-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  .pagination-container {
    padding: 12px 16px;
    display: flex;
    justify-content: flex-end;
    background-color: var(--bg-primary);
    border-top: 1px solid var(--border-color);
  }

  :deep(.el-pagination) {
    --el-pagination-bg-color: var(--bg-secondary);
    --el-pagination-hover-color: var(--primary-color);
    --el-pagination-button-color: var(--text-primary);
    
    .el-pager li {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      
      &.is-active {
        background-color: var(--primary-color);
        color: white;
      }
    }

    .btn-prev,
    .btn-next {
      background-color: var(--bg-secondary);
      
      &:disabled {
        background-color: var(--bg-secondary);
        opacity: 0.5;
      }
    }
  }
}

.card-header {
  .title {
    @apply text-lg font-medium text-gray-900 dark:text-gray-100;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-time {
  margin-right: 8px;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
}

.page-name {
  color: var(--el-text-color-primary);
  text-decoration: none;
  cursor: default;
}

:deep(.el-table .cell) {
  color: var(--el-text-color-primary);
}
</style> 