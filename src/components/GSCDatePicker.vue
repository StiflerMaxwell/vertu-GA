<template>
  <el-date-picker
    v-model="dateRange"
    type="daterange"
    range-separator="至"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    :disabled-date="disabledDate"
    :shortcuts="shortcuts"
    value-format="YYYY-MM-DD"
    size="default"
    style="width: 320px"
    unlink-panels
    @change="handleChange"
  />
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  startDate: String,
  endDate: String
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'change'])

// 快捷选项
const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      end.setDate(end.getDate() - 3) // 考虑GSC数据延迟
      const start = new Date(end)
      start.setDate(end.getDate() - 7)
      return [start, end]
    }
  },
  {
    text: '最近两周',
    value: () => {
      const end = new Date()
      end.setDate(end.getDate() - 3)
      const start = new Date(end)
      start.setDate(end.getDate() - 14)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      end.setDate(end.getDate() - 3)
      const start = new Date(end)
      start.setMonth(end.getMonth() - 1)
      return [start, end]
    }
  }
]

// 计算属性处理日期范围
const dateRange = computed({
  get() {
    return props.startDate && props.endDate ? [props.startDate, props.endDate] : []
  },
  set(value) {
    if (value) {
      emit('update:startDate', value[0])
      emit('update:endDate', value[1])
    }
  }
})

// 禁用未来日期和超过180天的历史数据
const disabledDate = (time) => {
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)
  
  return time.getTime() > now.getTime() || time.getTime() < sixMonthsAgo.getTime()
}

const handleChange = (value) => {
  if (value) {
    emit('change', value)
  }
}
</script>

<style scoped>
:deep(.el-range-editor) {
  --el-border-radius: var(--border-radius-md);
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}

:deep(.el-range-editor:hover) {
  border-color: var(--primary-color);
}

:deep(.el-range-editor.is-active) {
  border-color: var(--primary-color);
}

:deep(.el-range-input) {
  background-color: transparent;
  color: var(--text-color);
}

:deep(.el-range-separator) {
  color: var(--text-secondary);
}

:deep(.el-icon) {
  color: var(--text-secondary);
}
</style> 