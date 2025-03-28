<template>
  <el-card class="events-card !border-none">
    <template #header>
      <div class="card-header">
        <span class="title">实时事件</span>
      </div>
    </template>

    <el-table :data="tableData" style="width: 100%" :max-height="400">
      <el-table-column prop="eventName" label="事件名称" min-width="180">
        <template #default="{ row }">
          {{ formatEventName(row.eventName) }}
        </template>
      </el-table-column>
      <el-table-column 
        prop="eventCount" 
        label="事件次数" 
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
import { computed } from 'vue'

const props = defineProps({
  eventsData: {
    type: Array,
    default: () => []
  },
  lastUpdateTime: {
    type: String,
    default: ''
  }
})

const tableData = computed(() => {
  return props.eventsData.map(item => ({
    eventName: item.dimensionValues?.[0]?.value || '',
    eventCount: parseInt(item.metricValues?.[0]?.value) || 0
  }))
})

const formatEventName = (eventName) => {
  if (!eventName) return '-'
  
  return eventName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
</script>

<style lang="scss" scoped>
.events-card {
  margin-bottom: 16px;
  transition: opacity 0.3s;
  background-color: #fff;

  &.loading {
    opacity: 0.6;
    pointer-events: none;
  }

  :deep(.el-card) {
    background-color: var(--bg-primary);
    border: none;
    
    .el-card__body {
      padding: 16px;
      
      @media screen and (max-width: 768px) {
        padding: 2px !important;
      }
    }

    .el-card__header {
      padding: 12px 16px;
      background-color: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
    }
  }

  &.dark {
    background-color: #1a1a1a;

    :deep(.el-card__body) {
      background-color: #1a1a1a;
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

  .table-cell-text {
    color: var(--text-primary);
  }

  .warning-text {
    color: var(--danger-color);
  }

  :deep(.el-pagination) {
    padding: 16px;
    justify-content: flex-end;
    background-color: var(--bg-primary);
    border-top: 1px solid var(--border-color);

    .el-pagination__total,
    .el-pagination__jump {
      color: var(--text-secondary);
    }

    .btn-prev,
    .btn-next {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }

    .el-pager li {
      background-color: var(--bg-secondary);
      color: var(--text-primary);

      &.active {
        background-color: var(--primary-color);
        color: #fff;
      }

      &:hover {
        color: var(--primary-light);
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

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
</style> 