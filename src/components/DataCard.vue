<template>
  <el-card class="data-card">
    <template #header>
      <div class="card-header">
        <span>{{ title }}</span>
        <el-tag size="small" :type="trend > 0 ? 'success' : 'danger'" v-if="trend">
          {{ trend > 0 ? '+' : '' }}{{ trend }}%
        </el-tag>
      </div>
    </template>
    <div class="card-value">{{ value }}</div>
  </el-card>
</template>

<script>
export default {
  name: 'DataCard',
  props: {
    title: String,
    value: [String, Number],
    trend: Number
  }
}
</script>

<style scoped>
.data-card {
  height: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
</style> 