<template>
  <div class="suggestions-section">
    <div class="suggestions-header">
      <h3>优化建议</h3>
      <div class="header-actions">
        <el-select v-model="priorityFilter" size="small" placeholder="优先级">
          <el-option label="全部" value="all" />
          <el-option label="高优先级" value="high" />
          <el-option label="中优先级" value="medium" />
          <el-option label="低优先级" value="low" />
        </el-select>
        <el-select v-model="categoryFilter" size="small" placeholder="类别">
          <el-option label="全部" value="all" />
          <el-option label="性能优化" value="performance" />
          <el-option label="用户体验" value="ux" />
          <el-option label="转化率" value="conversion" />
          <el-option label="内容策略" value="content" />
        </el-select>
      </div>
    </div>

    <div class="suggestions-content">
      <el-collapse v-model="activeNames">
        <el-collapse-item 
          v-for="suggestion in filteredSuggestions" 
          :key="suggestion.id" 
          :name="suggestion.id"
        >
          <template #title>
            <div class="suggestion-title">
              <el-tag 
                :type="getPriorityType(suggestion.priority)" 
                size="small" 
                effect="dark"
              >
                {{ suggestion.priority }}
              </el-tag>
              <span class="title-text">{{ suggestion.title }}</span>
              <el-tag 
                :type="getCategoryType(suggestion.category)" 
                size="small" 
                class="category-tag"
              >
                {{ getCategoryLabel(suggestion.category) }}
              </el-tag>
            </div>
          </template>

          <div class="suggestion-detail">
            <div class="detail-section">
              <h4>问题描述</h4>
              <p>{{ suggestion.description }}</p>
            </div>

            <div class="detail-section">
              <h4>影响分析</h4>
              <div class="impact-metrics">
                <div class="impact-item" v-for="(impact, idx) in suggestion.impacts" :key="idx">
                  <el-icon><component :is="impact.icon" /></el-icon>
                  <div class="impact-content">
                    <div class="impact-title">{{ impact.title }}</div>
                    <div class="impact-value" :class="impact.trend">
                      {{ impact.value }}
                      <el-icon>
                        <component :is="impact.trend === 'up' ? 'ArrowUp' : 'ArrowDown'" />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>优化建议</h4>
              <div class="suggestion-steps">
                <div 
                  class="step-item" 
                  v-for="(step, idx) in suggestion.steps" 
                  :key="idx"
                >
                  <div class="step-number">{{ idx + 1 }}</div>
                  <div class="step-content">{{ step }}</div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>预期收益</h4>
              <div class="benefits">
                <el-tag 
                  v-for="(benefit, idx) in suggestion.benefits" 
                  :key="idx"
                  effect="dark"
                  class="benefit-tag"
                >
                  <el-icon><Check /></el-icon>
                  {{ benefit }}
                </el-tag>
              </div>
            </div>

            <div class="action-section">
              <el-button type="primary" size="small">
                <el-icon><Document /></el-icon>
                生成详细报告
              </el-button>
              <el-button size="small">
                <el-icon><Share /></el-icon>
                分享建议
              </el-button>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ArrowUp,
  ArrowDown,
  Check,
  Document,
  Share,
  Timer,
  User,
  ShoppingCart,
  View
} from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      trends: [],
      metrics: {},
      performance: {},
      userBehavior: {}
    })
  }
})

const priorityFilter = ref('all')
const categoryFilter = ref('all')
const activeNames = ref(['1'])

// 基于数据分析生成建议
const generateSuggestions = computed(() => {
  const suggestions = []
  const { trends, metrics, performance, userBehavior } = props.data

  // 性能相关建议
  if (performance.loadTime > 3) { // 如果页面加载时间超过3秒
    suggestions.push({
      id: 'perf-1',
      title: '优化页面加载性能',
      priority: '高优先级',
      category: 'performance',
      description: `页面平均加载时间为 ${performance.loadTime.toFixed(1)} 秒，超出行业标准 ${(performance.loadTime - 3).toFixed(1)} 秒。主要性能瓶颈：${performance.bottlenecks.join('、')}。`,
      impacts: [
        {
          icon: 'Timer',
          title: '页面加载时间',
          value: `${performance.loadTime.toFixed(1)}s`,
          trend: 'down'
        },
        {
          icon: 'User',
          title: '跳出率',
          value: `${(metrics.bounceRate * 100).toFixed(1)}%`,
          trend: 'up'
        }
      ],
      steps: performance.optimizationSteps,
      benefits: [
        `预计可提升页面加载速度 ${((performance.loadTime - 2) / performance.loadTime * 100).toFixed(0)}%`,
        `预计可降低跳出率 ${(metrics.bounceRate * 30).toFixed(0)}%`,
        '提升用户体验和转化率'
      ]
    })
  }

  // 转化率相关建议
  if (metrics.conversionRate < 0.02) { // 如果转化率低于2%
    const mobileConversionRate = userBehavior.mobileConversion || 0
    const desktopConversionRate = userBehavior.desktopConversion || 0
    const conversionDiff = ((desktopConversionRate - mobileConversionRate) / desktopConversionRate * 100).toFixed(0)

    if (mobileConversionRate < desktopConversionRate) {
      suggestions.push({
        id: 'conv-1',
        title: '优化移动端转化路径',
        priority: '高优先级',
        category: 'conversion',
        description: `移动端转化率（${(mobileConversionRate * 100).toFixed(1)}%）低于桌面端（${(desktopConversionRate * 100).toFixed(1)}%）${conversionDiff}%。主要流失环节：${userBehavior.dropoffPoints.join('、')}。`,
        impacts: [
          {
            icon: 'ShoppingCart',
            title: '移动端转化率',
            value: `${(mobileConversionRate * 100).toFixed(1)}%`,
            trend: 'down'
          },
          {
            icon: 'View',
            title: '移动端放弃率',
            value: `${(userBehavior.mobileAbandonRate * 100).toFixed(1)}%`,
            trend: 'up'
          }
        ],
        steps: userBehavior.optimizationSteps,
        benefits: [
          `预计可提升移动端转化率 ${(mobileConversionRate * 100).toFixed(0)}%`,
          `预计可减少放弃率 ${(userBehavior.mobileAbandonRate * 40).toFixed(0)}%`,
          '提升整体营收表现'
        ]
      })
    }
  }

  // 用户体验相关建议
  if (metrics.avgSessionDuration < 120) { // 如果平均会话时长小于2分钟
    suggestions.push({
      id: 'ux-1',
      title: '提升用户参与度',
      priority: '中优先级',
      category: 'ux',
      description: `用户平均会话时长 ${Math.floor(metrics.avgSessionDuration)}s，页面浏览深度 ${metrics.avgPageDepth.toFixed(1)}。用户参与度有提升空间。`,
      impacts: [
        {
          icon: 'Timer',
          title: '平均会话时长',
          value: `${Math.floor(metrics.avgSessionDuration)}s`,
          trend: 'down'
        },
        {
          icon: 'View',
          title: '平均页面浏览量',
          value: metrics.avgPageDepth.toFixed(1),
          trend: 'down'
        }
      ],
      steps: [
        '优化内容展示和导航结构',
        '增加相关内容推荐',
        '优化搜索体验',
        '添加用户引导和互动元素'
      ],
      benefits: [
        `预计可提升会话时长 ${((180 - metrics.avgSessionDuration) / metrics.avgSessionDuration * 100).toFixed(0)}%`,
        `预计可提升页面浏览量 ${((4 - metrics.avgPageDepth) / metrics.avgPageDepth * 100).toFixed(0)}%`,
        '提升用户粘性和转化机会'
      ]
    })
  }

  return suggestions
})

// 替换原来的静态 suggestions
const suggestions = computed(() => generateSuggestions.value)

const filteredSuggestions = computed(() => {
  return suggestions.value.filter(suggestion => {
    const matchPriority = priorityFilter.value === 'all' || 
      suggestion.priority.toLowerCase().includes(priorityFilter.value)
    const matchCategory = categoryFilter.value === 'all' || 
      suggestion.category === categoryFilter.value
    return matchPriority && matchCategory
  })
})

const getPriorityType = (priority) => {
  const types = {
    '高优先级': 'danger',
    '中优先级': 'warning',
    '低优先级': 'info'
  }
  return types[priority] || 'info'
}

const getCategoryType = (category) => {
  const types = {
    performance: 'success',
    ux: 'warning',
    conversion: 'danger',
    content: 'info'
  }
  return types[category] || 'info'
}

const getCategoryLabel = (category) => {
  const labels = {
    performance: '性能优化',
    ux: '用户体验',
    conversion: '转化率',
    content: '内容策略'
  }
  return labels[category] || category
}
</script>

<style scoped>
.suggestions-section {
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.suggestions-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

:deep(.el-collapse) {
  border: none;
  background: transparent;
}

:deep(.el-collapse-item__header) {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: #fff;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

:deep(.el-collapse-item__content) {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0 0 8px 8px;
  color: rgba(255, 255, 255, 0.9);
  padding: 20px;
}

.suggestion-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-text {
  flex: 1;
}

.category-tag {
  margin-left: auto;
}

.detail-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 12px 0;
    font-size: 16px;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    line-height: 1.6;
  }
}

.impact-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.impact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.impact-content {
  flex: 1;
}

.impact-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 4px;
}

.impact-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
  font-weight: 500;

  &.up {
    color: #F56C6C;
  }

  &.down {
    color: #67C23A;
  }
}

.suggestion-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.benefit-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
}

.action-section {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

:deep(.el-select) {
  .el-input__wrapper {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }

  .el-input__inner {
    color: rgba(255, 255, 255, 0.9);
  }
}
</style> 