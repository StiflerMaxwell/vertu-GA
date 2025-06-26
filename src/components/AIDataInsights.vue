<template>
  <div class="ai-data-insights">
    <!-- 顶部控制区域 -->
    <div class="insights-header">
      <div class="header-left">
        <h2 class="title">🤖 AI数据洞察与行动建议</h2>
        <p class="subtitle">基于Gemini AI的全方位数据分析和业务优化建议</p>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          size="default"
          :loading="loading"
          @click="refreshAllAnalysis"
        >
          <el-icon><Refresh /></el-icon>
          重新分析
        </el-button>
      </div>
    </div>

    <!-- API配置提醒 -->
    <div v-if="!isGeminiConfigured" class="api-notice">
      <el-alert
        title="AI分析功能需要配置"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>请在 .env 文件中配置 Gemini API Key：</p>
          <code>VITE_GEMINI_API_KEY=your_gemini_api_key</code>
          <p class="mt-2">
            <a href="https://makersuite.google.com/app/apikey" target="_blank" class="link">
              获取 Gemini API Key →
            </a>
          </p>
        </template>
      </el-alert>
    </div>

    <!-- 四大分析板块 -->
    <div class="analysis-sections">
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <!-- 网站健康分析 -->
        <el-tab-pane label="🏥 网站健康" name="health">
          <div class="analysis-content">
            <div class="metrics-overview">
              <el-row :gutter="16">
                <el-col :span="6">
                  <div class="metric-card health">
                    <div class="metric-icon">🚀</div>
                    <div class="metric-data">
                      <div class="metric-value">{{ healthScore }}/100</div>
                      <div class="metric-label">网站健康度</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card engagement">
                    <div class="metric-icon">👥</div>
                    <div class="metric-data">
                      <div class="metric-value">{{ engagementScore }}/100</div>
                      <div class="metric-label">用户参与度</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card performance">
                    <div class="metric-icon">⚡</div>
                    <div class="metric-data">
                      <div class="metric-value">{{ performanceScore }}/100</div>
                      <div class="metric-label">技术性能</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card status">
                    <div class="metric-icon">📈</div>
                    <div class="metric-data">
                      <div class="metric-value">{{ overallStatus }}</div>
                      <div class="metric-label">总体状态</div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
            
            <el-card class="analysis-card">
              <template #header>
                <div class="card-header">
                  <span class="title">AI 健康分析报告</span>
                  <el-button 
                    type="primary" 
                    size="small"
                    :loading="analyzingHealth"
                    @click="analyzeWebsiteHealth"
                  >
                    <el-icon><Robot /></el-icon>
                    分析
                  </el-button>
                </div>
              </template>
              <div class="analysis-result">
                <div v-if="analyzingHealth" class="loading-state">
                  <el-skeleton :rows="8" animated />
                </div>
                <div v-else-if="healthAnalysis" class="ai-content">
                  <div v-html="formatAIResponse(healthAnalysis)" class="ai-response"></div>
                </div>
                <div v-else class="empty-state">
                  <el-empty description="点击分析按钮开始AI健康分析" />
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 转化漏斗分析 -->
        <el-tab-pane label="🎯 转化漏斗" name="conversion">
          <div class="analysis-content">
            <div class="funnel-visualization">
              <div ref="conversionFunnelRef" class="funnel-chart"></div>
            </div>
            
            <el-card class="analysis-card">
              <template #header>
                <div class="card-header">
                  <span class="title">AI 转化分析报告</span>
                  <el-button 
                    type="primary" 
                    size="small"
                    :loading="analyzingConversion"
                    @click="analyzeConversionFunnel"
                  >
                    <el-icon><Robot /></el-icon>
                    分析
                  </el-button>
                </div>
              </template>
              <div class="analysis-result">
                <div v-if="analyzingConversion" class="loading-state">
                  <el-skeleton :rows="8" animated />
                </div>
                <div v-else-if="conversionAnalysis" class="ai-content">
                  <div v-html="formatAIResponse(conversionAnalysis)" class="ai-response"></div>
                </div>
                <div v-else class="empty-state">
                  <el-empty description="点击分析按钮开始AI转化分析" />
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 流量渠道分析 -->
        <el-tab-pane label="📈 流量渠道" name="channels">
          <div class="analysis-content">
            <el-card class="analysis-card">
              <template #header>
                <div class="card-header">
                  <span class="title">AI 渠道分析报告</span>
                  <el-button 
                    type="primary" 
                    size="small"
                    :loading="analyzingChannels"
                    @click="analyzeTrafficChannels"
                  >
                    <el-icon><Robot /></el-icon>
                    分析
                  </el-button>
                </div>
              </template>
              <div class="analysis-result">
                <div v-if="analyzingChannels" class="loading-state">
                  <el-skeleton :rows="8" animated />
                </div>
                <div v-else-if="channelsAnalysis" class="ai-content">
                  <div v-html="formatAIResponse(channelsAnalysis)" class="ai-response"></div>
                </div>
                <div v-else class="empty-state">
                  <el-empty description="点击分析按钮开始AI渠道分析" />
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 用户行为分析 -->
        <el-tab-pane label="👤 用户行为" name="behavior">
          <div class="analysis-content">
            <el-card class="analysis-card">
              <template #header>
                <div class="card-header">
                  <span class="title">AI 行为分析报告</span>
                  <el-button 
                    type="primary" 
                    size="small"
                    :loading="analyzingBehavior"
                    @click="analyzeUserBehavior"
                  >
                    <el-icon><Robot /></el-icon>
                    分析
                  </el-button>
                </div>
              </template>
              <div class="analysis-result">
                <div v-if="analyzingBehavior" class="loading-state">
                  <el-skeleton :rows="8" animated />
                </div>
                <div v-else-if="behaviorAnalysis" class="ai-content">
                  <div v-html="formatAIResponse(behaviorAnalysis)" class="ai-response"></div>
                </div>
                <div v-else class="empty-state">
                  <el-empty description="点击分析按钮开始AI行为分析" />
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 综合洞察 -->
        <el-tab-pane label="🎯 综合洞察" name="comprehensive">
          <div class="analysis-content">
            <el-card class="comprehensive-card">
              <template #header>
                <div class="card-header">
                  <span class="title">🤖 AI 综合业务洞察</span>
                  <el-button 
                    type="primary" 
                    size="small"
                    :loading="analyzingComprehensive"
                    @click="generateComprehensiveInsights"
                  >
                    <el-icon><Robot /></el-icon>
                    生成洞察
                  </el-button>
                </div>
              </template>
              <div class="comprehensive-content">
                <div v-if="analyzingComprehensive" class="loading-state">
                  <el-skeleton :rows="12" animated />
                  <div class="loading-tips">
                    <p>🤖 AI正在深度分析您的业务数据...</p>
                    <p>⏱️ 这可能需要30-60秒，请耐心等待</p>
                  </div>
                </div>
                <div v-else-if="comprehensiveInsights" class="ai-content">
                  <div v-html="formatAIResponse(comprehensiveInsights)" class="ai-response comprehensive"></div>
                </div>
                <div v-else class="empty-state">
                  <el-empty description="点击生成洞察按钮获取AI综合分析" />
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { geminiClient } from '@/api/gemini'
import { ga4Client } from '@/api/ga4'
import { clarityClient } from '@/api/clarity'
import { getOrderAnalytics } from '@/api/woocommerce'
import {
  Refresh,
  Robot
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

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

// 响应式数据
const loading = ref(false)
const activeTab = ref('health')

// 分析状态
const analyzingHealth = ref(false)
const analyzingConversion = ref(false)
const analyzingChannels = ref(false)
const analyzingBehavior = ref(false)
const analyzingComprehensive = ref(false)

// 分析结果
const healthAnalysis = ref('')
const conversionAnalysis = ref('')
const channelsAnalysis = ref('')
const behaviorAnalysis = ref('')
const comprehensiveInsights = ref('')

// 图表引用
const conversionFunnelRef = ref(null)

// 数据存储
const businessData = ref({
  ga4: {},
  clarity: {},
  woocommerce: {},
  performance: {},
  gsc: {}
})

// 计算属性
const isGeminiConfigured = computed(() => {
  return !!import.meta.env.VITE_GEMINI_API_KEY
})

const healthScore = computed(() => {
  const data = businessData.value
  let score = 0
  
  if (data.ga4?.bounceRate < 60) score += 40
  else if (data.ga4?.bounceRate < 80) score += 20
  
  if (data.performance?.loadTime < 3000) score += 30
  else if (data.performance?.loadTime < 5000) score += 15
  
  if (data.ga4?.eventsPerSession > 3) score += 30
  else if (data.ga4?.eventsPerSession > 1) score += 15
  
  return Math.min(Math.round(score), 100)
})

const engagementScore = computed(() => {
  const data = businessData.value
  let score = 0
  
  if (data.ga4?.avgEngagementTime > 120) score += 30
  else if (data.ga4?.avgEngagementTime > 60) score += 15
  
  if (data.clarity?.avgScrollDepth > 50) score += 30
  else if (data.clarity?.avgScrollDepth > 25) score += 15
  
  if (data.ga4?.pageViewsPerSession > 2) score += 40
  else if (data.ga4?.pageViewsPerSession > 1.5) score += 20
  
  return Math.min(Math.round(score), 100)
})

const performanceScore = computed(() => {
  const data = businessData.value
  let score = 0
  
  if (data.performance?.coreWebVitals > 90) score += 50
  else if (data.performance?.coreWebVitals > 75) score += 30
  else if (data.performance?.coreWebVitals > 50) score += 15
  
  if (data.performance?.loadTime < 2000) score += 50
  else if (data.performance?.loadTime < 3000) score += 30
  else if (data.performance?.loadTime < 5000) score += 15
  
  return Math.min(Math.round(score), 100)
})

const overallStatus = computed(() => {
  const avg = (healthScore.value + engagementScore.value + performanceScore.value) / 3
  if (avg >= 80) return '优秀'
  if (avg >= 60) return '良好'
  if (avg >= 40) return '一般'
  return '需改进'
})

// 方法
const refreshAllAnalysis = async () => {
  loading.value = true
  try {
    await loadBusinessData()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const loadBusinessData = async () => {
  try {
    const [ga4Data, clarityData, wooData] = await Promise.all([
      getGA4Data(),
      getClarityData(),
      getWooCommerceData()
    ])
    
    businessData.value = {
      ga4: ga4Data,
      clarity: clarityData,
      woocommerce: wooData,
      performance: await getPerformanceData(),
      gsc: await getGSCData()
    }
  } catch (error) {
    console.error('加载业务数据失败:', error)
  }
}

const getGA4Data = async () => {
  try {
    const basicMetrics = await ga4Client.runReport({
      dateRanges: [{ startDate: props.startDate, endDate: props.endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'bounceRate' },
        { name: 'userEngagementDuration' },
        { name: 'eventsPerSession' },
        { name: 'screenPageViewsPerSession' }
      ]
    })
    
    const conversionData = await ga4Client.runReport({
      dateRanges: [{ startDate: props.startDate, endDate: props.endDate }],
      metrics: [
        { name: 'addToCarts' },
        { name: 'checkouts' },
        { name: 'purchases' }
      ]
    })
    
    return {
      totalUsers: basicMetrics.rows?.[0]?.metricValues?.[0]?.value || 0,
      bounceRate: parseFloat(basicMetrics.rows?.[0]?.metricValues?.[1]?.value) || 0,
      avgEngagementTime: parseFloat(basicMetrics.rows?.[0]?.metricValues?.[2]?.value) || 0,
      eventsPerSession: parseFloat(basicMetrics.rows?.[0]?.metricValues?.[3]?.value) || 0,
      pageViewsPerSession: parseFloat(basicMetrics.rows?.[0]?.metricValues?.[4]?.value) || 0,
      addToCartEvents: conversionData.rows?.[0]?.metricValues?.[0]?.value || 0,
      checkoutEvents: conversionData.rows?.[0]?.metricValues?.[1]?.value || 0,
      purchaseEvents: conversionData.rows?.[0]?.metricValues?.[2]?.value || 0
    }
  } catch (error) {
    console.error('获取GA4数据失败:', error)
    return {}
  }
}

const getClarityData = async () => {
  try {
    const scrollData = await clarityClient.getScrollDepthMetrics(1)
    const trafficData = await clarityClient.getTrafficByOS(1)
    
    const avgScrollDepth = scrollData?.reduce((sum, item) => sum + item.scrollDepth, 0) / scrollData?.length || 0
    const totalSessions = trafficData?.reduce((sum, item) => sum + item.totalSessions, 0) || 0
    
    return {
      avgScrollDepth,
      totalSessions,
      scrollData,
      trafficData
    }
  } catch (error) {
    console.error('获取Clarity数据失败:', error)
    return {}
  }
}

const getWooCommerceData = async () => {
  try {
    return await getOrderAnalytics(props.startDate, props.endDate)
  } catch (error) {
    console.error('获取WooCommerce数据失败:', error)
    return {}
  }
}

const getPerformanceData = async () => {
  return {
    loadTime: 2500,
    coreWebVitals: 85
  }
}

const getGSCData = async () => {
  return {
    totalClicks: 1250,
    totalImpressions: 15000,
    avgCTR: 8.33,
    avgPosition: 12.5
  }
}

// AI分析方法
const analyzeWebsiteHealth = async () => {
  if (!isGeminiConfigured.value) {
    ElMessage.warning('请先配置Gemini API Key')
    return
  }
  
  analyzingHealth.value = true
  try {
    const analysis = await geminiClient.analyzeWebsiteHealth(businessData.value)
    healthAnalysis.value = analysis
  } catch (error) {
    ElMessage.error('AI分析失败，请稍后重试')
  } finally {
    analyzingHealth.value = false
  }
}

const analyzeConversionFunnel = async () => {
  if (!isGeminiConfigured.value) {
    ElMessage.warning('请先配置Gemini API Key')
    return
  }
  
  analyzingConversion.value = true
  try {
    const analysis = await geminiClient.analyzeConversionFunnel(businessData.value)
    conversionAnalysis.value = analysis
    await nextTick()
    renderConversionFunnel()
  } catch (error) {
    ElMessage.error('AI分析失败，请稍后重试')
  } finally {
    analyzingConversion.value = false
  }
}

const analyzeTrafficChannels = async () => {
  if (!isGeminiConfigured.value) {
    ElMessage.warning('请先配置Gemini API Key')
    return
  }
  
  analyzingChannels.value = true
  try {
    const analysis = await geminiClient.analyzeTrafficChannels(businessData.value)
    channelsAnalysis.value = analysis
  } catch (error) {
    ElMessage.error('AI分析失败，请稍后重试')
  } finally {
    analyzingChannels.value = false
  }
}

const analyzeUserBehavior = async () => {
  if (!isGeminiConfigured.value) {
    ElMessage.warning('请先配置Gemini API Key')
    return
  }
  
  analyzingBehavior.value = true
  try {
    const analysis = await geminiClient.analyzeUserBehavior(businessData.value)
    behaviorAnalysis.value = analysis
  } catch (error) {
    ElMessage.error('AI分析失败，请稍后重试')
  } finally {
    analyzingBehavior.value = false
  }
}

const generateComprehensiveInsights = async () => {
  if (!isGeminiConfigured.value) {
    ElMessage.warning('请先配置Gemini API Key')
    return
  }
  
  analyzingComprehensive.value = true
  try {
    const insights = await geminiClient.generateComprehensiveInsights(businessData.value)
    comprehensiveInsights.value = insights
  } catch (error) {
    ElMessage.error('AI分析失败，请稍后重试')
  } finally {
    analyzingComprehensive.value = false
  }
}

// 图表渲染方法
const renderConversionFunnel = () => {
  if (!conversionFunnelRef.value) return
  
  const chart = echarts.init(conversionFunnelRef.value)
  const data = businessData.value
  
  const funnelData = [
    { name: '访问用户', value: data.ga4?.totalUsers || 100 },
    { name: '加购用户', value: data.ga4?.addToCartEvents || 25 },
    { name: '结账用户', value: data.ga4?.checkoutEvents || 15 },
    { name: '完成购买', value: data.ga4?.purchaseEvents || 8 }
  ]
  
  const option = {
    title: {
      text: '转化漏斗',
      left: 'center',
      textStyle: { color: 'var(--text-primary)' }
    },
    series: [{
      type: 'funnel',
      data: funnelData,
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}: {c}'
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      }
    }]
  }
  
  chart.setOption(option)
}

// 工具方法
const formatAIResponse = (text) => {
  if (!text) return ''
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

const handleTabChange = (tabName) => {
  activeTab.value = tabName
}

// 生命周期
onMounted(() => {
  loadBusinessData()
})
</script>

<style lang="scss" scoped>
.ai-data-insights {
  .insights-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-color-light));
    border-radius: 12px;
    color: white;

    .header-left {
      .title {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }

      .subtitle {
        font-size: 14px;
        opacity: 0.9;
        margin: 0;
      }
    }
  }

  .api-notice {
    margin-bottom: 20px;

    .link {
      color: var(--primary-color);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .analysis-sections {
    margin-bottom: 24px;

    .analysis-content {
      .metrics-overview {
        margin-bottom: 20px;

        .metric-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          height: 80px;

          .metric-icon {
            font-size: 24px;
          }

          .metric-data {
            .metric-value {
              font-size: 20px;
              font-weight: 600;
              color: var(--text-primary);
              line-height: 1;
            }

            .metric-label {
              font-size: 12px;
              color: var(--text-secondary);
              margin-top: 4px;
            }
          }
        }
      }

      .analysis-card {
        .analysis-result {
          min-height: 200px;

          .loading-state {
            padding: 20px;
          }

          .ai-content {
            padding: 20px;

            .ai-response {
              line-height: 1.6;
              color: var(--text-primary);

              &.comprehensive {
                font-size: 15px;
              }
            }
          }

          .empty-state {
            padding: 40px;
            text-align: center;
          }
        }
      }

      .funnel-visualization {
        margin-bottom: 20px;

        .funnel-chart {
          height: 300px;
          width: 100%;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }
      }
    }

    .comprehensive-card {
      .comprehensive-content {
        .loading-state {
          padding: 20px;

          .loading-tips {
            margin-top: 20px;
            text-align: center;
            color: var(--text-secondary);

            p {
              margin: 8px 0;
            }
          }
        }
      }
    }
  }

  :deep(.el-card) {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-weight: 600;
        color: var(--text-primary);
      }
    }
  }

  :deep(.el-tabs) {
    .el-tabs__header {
      background: var(--bg-primary);
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 20px;
    }

    .el-tabs__nav {
      border: none;
    }

    .el-tabs__item {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 12px 20px;
      border-radius: 6px;
      margin-right: 8px;

      &.is-active {
        background: var(--primary-color);
        color: white;
      }

      &:hover:not(.is-active) {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
    }

    .el-tabs__content {
      padding: 0;
    }
  }
}
</style> 