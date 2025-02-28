<template>
  <el-card class="source-card !border-none" :class="{ loading }">
    <template #header>
      <div class="card-header">
        <span class="title">用户来源</span>
      </div>
    </template>

    <el-table 
      :data="processedData" 
      :max-height="400"
    >
      <el-table-column 
        label="来源 / 媒介" 
        prop="source" 
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span class="table-cell-text">{{ row.source }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        label="用户数" 
        prop="users" 
        width="100"
        sortable
      >
        <template #default="{ row }">
          <span class="table-cell-text">{{ row.users }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        label="占比" 
        width="200"
      >
        <template #default="{ row }">
          <div class="percentage-wrapper">
            <div class="percentage-bar">
              <div 
                class="bar"
                :style="{ width: row.percentage + '%' }"
              />
            </div>
            <span class="percentage-value table-cell-text">{{ row.percentage }}%</span>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sourceData: {
    type: Array,
    default: () => []
  },
  loading: Boolean
})

// 处理数据，计算百分比
const processedData = computed(() => {
  if (!props.sourceData?.length) return []
  
  const total = props.sourceData.reduce((sum, item) => sum + item.users, 0)
  
  return props.sourceData.map(item => ({
    ...item,
    percentage: ((item.users / total) * 100).toFixed(1)
  }))
})
</script>

<style lang="scss" scoped>
.source-card {
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

  .table-cell-text {
    color: var(--text-primary);
  }

  .percentage-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .percentage-bar {
    flex: 1;
    height: 8px;
    background-color: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;

    .bar {
      height: 100%;
      background-color: var(--primary-color);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }

  .percentage-value {
    min-width: 48px;
    text-align: right;
  }
}
</style> 