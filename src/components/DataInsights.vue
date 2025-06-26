<template>
  <div class="data-insights">
    <div class="header">
      <h2>🤖 AI数据洞察与行动建议</h2>
      <div class="header-actions">
        <el-button @click="toggleDataPreview" type="text">
          {{ showDataPreview ? '隐藏' : '查看' }}原始数据
        </el-button>
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 数据预览区域 -->
    <el-collapse v-if="showDataPreview" class="data-preview">
      <el-collapse-item title="加载的原始数据预览" name="rawData">
        <pre class="data-json">{{ JSON.stringify(businessData, null, 2) }}</pre>
      </el-collapse-item>
    </el-collapse>

    <div v-if="!isGeminiConfigured" class="config-notice">
      <el-alert title="需要配置Gemini API Key" type="info">
        请在.env文件中添加: VITE_GEMINI_API_KEY=your_key
      </el-alert>
    </div>

    <!-- 数据质量警告 -->
    <div v-if="businessData.dataQuality?.validationReport" class="data-quality-alerts">
      <el-alert 
        v-if="businessData.dataQuality.validationReport.overallHealth === 'critical'"
        title="严重数据质量问题"
        type="error"
        show-icon
        :closable="false"
      >
        <template #default>
          <div class="alert-content">
            <p><strong>检测到关键追踪系统故障，数据分析结果不可信！</strong></p>
            <p>关键问题：</p>
            <ul>
              <li v-for="issue in businessData.dataQuality.validationReport.criticalIssues" :key="issue">
                {{ issue }}
              </li>
            </ul>
            <p><strong>建议立即联系技术团队修复数据追踪配置。</strong></p>
          </div>
        </template>
      </el-alert>

      <el-alert 
        v-else-if="businessData.dataQuality.validationReport.overallHealth === 'warning'"
        title="数据质量警告"
        type="warning"
        show-icon
        :closable="false"
      >
        <template #default>
          <div class="alert-content">
            <p>检测到以下数据质量问题：</p>
            <ul>
              <li v-for="issue in businessData.dataQuality.validationReport.warningIssues" :key="issue">
                {{ issue }}
              </li>
            </ul>
          </div>
        </template>
      </el-alert>

      <el-alert 
        v-else-if="businessData.dataQuality.validationReport.overallHealth === 'good'"
        title="数据质量良好"
        type="success"
        show-icon
        :closable="false"
      >
        所有数据源工作正常，分析结果可信。
      </el-alert>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="网站健康" name="health">
        <div class="tab-content">
          <div class="metrics">
            <div class="metric-card health">
              <div class="metric-title">综合健康度</div>
              <div class="metric-value">{{ healthScore }}/100</div>
              <div class="metric-desc">基于跳出率、参与时长、滚动深度等</div>
            </div>
            <div class="metric-card engagement">
              <div class="metric-title">用户参与度</div>
              <div class="metric-value">{{ engagementScore }}/100</div>
              <div class="metric-desc">GA4 + Clarity 综合评分</div>
            </div>
            <div class="metric-card conversion">
              <div class="metric-title">转化表现</div>
              <div class="metric-value">{{ conversionScore }}/100</div>
              <div class="metric-desc">基于用户到订单的转化率</div>
            </div>
            <div class="metric-card data-quality">
              <div class="metric-title">数据完整性</div>
              <div class="metric-value">{{ dataQualityScore }}%</div>
              <div class="metric-desc">所有数据源的可用性</div>
            </div>
          </div>
          
          <!-- 页面停留时长详细分析 -->
          <div class="page-engagement-section">
            <h4>页面停留时长分析</h4>
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="engagement-metric">
                  <div class="metric-title">平均停留时长</div>
                  <div class="metric-value">{{ formatDuration(businessData.ga4Data?.avgEngagementTime || 0) }}</div>
                  <div class="metric-desc">接近传统页面停留时长概念</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="engagement-metric">
                  <div class="metric-title">跳出率</div>
                  <div class="metric-value">{{ (businessData.ga4Data?.bounceRate || 0).toFixed(1) }}%</div>
                  <div class="metric-desc">用户立即离开的比例</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="engagement-metric">
                  <div class="metric-title">有效会话占比</div>
                  <div class="metric-value">{{ ((businessData.ga4Data?.engagedSessions / businessData.ga4Data?.sessions * 100) || 0).toFixed(1) }}%</div>
                  <div class="metric-desc">用户真正参与的会话</div>
                </div>
              </el-col>
            </el-row>
            
            <!-- 热门页面停留时长 -->
            <div v-if="businessData.ga4Data?.topPages?.length" class="top-pages-section">
              <h5>热门页面停留时长</h5>
              <el-table :data="businessData.ga4Data.topPages" size="small" stripe>
                <el-table-column prop="page" label="页面路径" width="300" />
                <el-table-column prop="pageViews" label="浏览量" width="100" />
                <el-table-column label="平均停留时长" width="150">
                  <template #default="{ row }">
                    {{ formatDuration(row.avgTimeOnPage) }}
                  </template>
                </el-table-column>
                <el-table-column label="跳出率" width="100">
                  <template #default="{ row }">
                    {{ row.bounceRate.toFixed(1) }}%
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- 跨平台洞察概览 -->
          <div v-if="businessData.crossPlatformInsights" class="insights-overview">
            <h4>跨平台数据洞察</h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="insight-item">
                  <strong>转化漏斗效率:</strong>
                  <span>整体转化率 {{ businessData.crossPlatformInsights.conversionFunnel?.overallConversionRate }}%</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="insight-item">
                  <strong>用户质量指数:</strong>
                  <span>{{ businessData.crossPlatformInsights.userEngagement?.userQualityIndex }}/100</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="insight-item">
                  <strong>自然流量占比:</strong>
                  <span>{{ businessData.crossPlatformInsights.trafficQuality?.organicTrafficShare }}%</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="insight-item">
                  <strong>数据一致性:</strong>
                  <span>{{ businessData.crossPlatformInsights.dataConsistency?.overallConsistencyScore }}/100</span>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <div class="ai-analysis">
            <el-button @click="analyzeHealth" :loading="analyzingHealth" type="primary">
              🔍 AI深度分析网站健康状况
            </el-button>
            <div v-if="healthAnalysis" class="analysis-result">
              <div v-html="formatAnalysisResult(healthAnalysis)"></div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="转化漏斗" name="funnel">
        <div class="tab-content">
          <div ref="funnelChart" class="chart"></div>
          <el-button @click="analyzeFunnel" :loading="analyzingFunnel">
            AI分析转化漏斗
          </el-button>
          <div v-if="funnelAnalysis" class="analysis-result">
            {{ funnelAnalysis }}
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="渠道分析" name="channels">
        <div class="tab-content">
          <el-button @click="analyzeChannels" :loading="analyzingChannels">
            AI分析流量渠道
          </el-button>
          <div v-if="channelsAnalysis" class="analysis-result">
            {{ channelsAnalysis }}
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="用户行为" name="behavior">
        <div class="tab-content">
          <el-button @click="analyzeBehavior" :loading="analyzingBehavior">
            AI分析用户行为
          </el-button>
          <div v-if="behaviorAnalysis" class="analysis-result">
            {{ behaviorAnalysis }}
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="综合洞察" name="comprehensive">
        <div class="tab-content">
          <el-button @click="generateInsights" :loading="analyzingComprehensive">
            生成综合洞察
          </el-button>
          <div v-if="comprehensiveInsights" class="analysis-result">
            {{ comprehensiveInsights }}
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { geminiClient } from '@/api/gemini'
import { ga4Client } from '@/api/ga4'
import clarityClient from '@/api/clarity'
import { getOrderAnalytics } from '@/api/woocommerce'
import { fetchSearchData } from '@/api/gsc'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  startDate: { type: String, required: true },
  endDate: { type: String, required: true }
})

// 状态
const loading = ref(false)
const activeTab = ref('health')
const analyzingHealth = ref(false)
const analyzingFunnel = ref(false)
const analyzingChannels = ref(false)
const analyzingBehavior = ref(false)
const analyzingComprehensive = ref(false)

// 分析结果
const healthAnalysis = ref('')
const funnelAnalysis = ref('')
const channelsAnalysis = ref('')
const behaviorAnalysis = ref('')
const comprehensiveInsights = ref('')

// 业务数据
const businessData = ref({})
const showDataPreview = ref(false)

// 计算属性
const isGeminiConfigured = computed(() => !!import.meta.env.VITE_GEMINI_API_KEY)

const healthScore = computed(() => {
  if (!businessData.value || !businessData.value.summary) return 0
  
  const summary = businessData.value.summary
  const dataQuality = businessData.value.dataQuality?.validationReport
  
  // 如果存在严重数据质量问题，直接返回0分
  if (dataQuality?.overallHealth === 'critical') {
    return 0
  }
  
  let score = 100
  
  // 数据质量扣分
  if (dataQuality?.criticalIssues?.length > 0) {
    score -= 50 // 严重问题直接扣50分
  }
  if (dataQuality?.warningIssues?.length > 0) {
    score -= 20 // 警告问题扣20分
  }
  
  // 只有在数据可信的情况下才进行业务指标评估
  if (dataQuality?.overallHealth === 'good' || dataQuality?.overallHealth === 'fair') {
    // 跳出率影响 (权重: 25%)
    const bounceRate = summary.bounceRate || 0
    if (bounceRate > 70) score -= 25
    else if (bounceRate > 50) score -= 15
    else if (bounceRate > 30) score -= 5
    
    // 参与时长影响 (权重: 20%) - 添加异常值检测
    const engagementTime = summary.avgEngagementTime || 0
    if (engagementTime > 86400) { // 超过24小时，数据异常
      score -= 30 // 异常数据扣更多分
    } else if (engagementTime < 30) {
      score -= 20
    } else if (engagementTime < 60) {
      score -= 10
    } else if (engagementTime < 120) {
      score -= 5
    }
    
    // 滚动深度影响 (权重: 20%)
    const scrollDepth = summary.clarityAvgScrollDepth || 0
    if (scrollDepth === 0) score -= 25 // 无Clarity数据
    else if (scrollDepth < 30) score -= 20
    else if (scrollDepth < 50) score -= 10
    else if (scrollDepth < 70) score -= 5
    
    // 转化率影响 (权重: 20%)
    const users = summary.totalUsers || 0
    const orders = summary.wooTotalOrders || 0
    const conversionRate = users > 0 ? (orders / users * 100) : 0
    if (conversionRate < 1) score -= 20
    else if (conversionRate < 2) score -= 10
    else if (conversionRate < 3) score -= 5
    
    // 搜索表现影响 (权重: 15%)
    const avgPosition = summary.gscAvgPosition || 0
    const avgCTR = summary.gscAvgCTR || 0
    if (avgPosition > 10 || avgCTR < 2) score -= 15
    else if (avgPosition > 5 || avgCTR < 3) score -= 8
  }
  
  return Math.max(Math.round(score), 0)
})

const engagementScore = computed(() => {
  if (!businessData.value || !businessData.value.crossPlatformInsights) return 0
  return businessData.value.crossPlatformInsights.userEngagement?.engagementScore || 0
})

const dataQualityScore = computed(() => {
  if (!businessData.value || !businessData.value.dataQuality) return 0
  return businessData.value.dataQuality.completeness || 0
})

const conversionScore = computed(() => {
  if (!businessData.value || !businessData.value.summary) return 0
  
  const summary = businessData.value.summary
  const users = summary.totalUsers || 0
  const addToCarts = summary.addToCartEvents || 0
  const checkouts = summary.checkoutEvents || 0
  const orders = summary.wooTotalOrders || 0
  
  if (users === 0) return 0
  
  // 整体转化率评分
  const overallConversion = (orders / users) * 100
  if (overallConversion >= 5) return 100
  if (overallConversion >= 3) return 80
  if (overallConversion >= 2) return 60
  if (overallConversion >= 1) return 40
  return Math.round(overallConversion * 20)
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    // 加载数据
    businessData.value = await loadAllData()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const loadAllData = async () => {
  try {
    console.log('开始加载所有数据...')
    ElMessage.info('正在加载分析数据，请稍候...')
    
    // 检查日期有效性
    if (!isValidDate(props.startDate) || !isValidDate(props.endDate)) {
      console.log('等待有效日期...')
      return {}
    }

    console.log(`数据获取时间范围: ${props.startDate} 至 ${props.endDate}`)
    
    // 并行加载所有数据源
    const [ga4Data, clarityData, wooData, gscData] = await Promise.all([
      loadGA4Data().catch(err => {
        console.warn('GA4数据加载失败:', err)
        return {}
      }),
      loadClarityData().catch(err => {
        console.warn('Clarity数据加载失败:', err)
        return {}
      }),
      loadWooData().catch(err => {
        console.warn('WooCommerce数据加载失败:', err)
        return {}
      }),
      loadGSCData().catch(err => {
        console.warn('GSC数据加载失败:', err)
        return {}
      })
    ])

    // 数据质量验证和异常检测
    const dataQualityReport = validateDataQuality(ga4Data, clarityData, wooData, gscData)
    console.log('数据质量报告:', dataQualityReport)
    
    // 计算跨数据源的关键指标
    const crossPlatformInsights = calculateCrossPlatformInsights(ga4Data, clarityData, wooData, gscData)
    
    const aggregatedData = {
      // 原始数据
      ga4: ga4Data,
      clarity: clarityData,
      woocommerce: wooData,
      gsc: gscData,
      
      // 汇总指标
      summary: {
        // GA4 核心指标
        totalUsers: ga4Data.totalUsers || 0,
        sessions: ga4Data.sessions || 0,
        bounceRate: ga4Data.bounceRate || 0,
        avgEngagementTime: ga4Data.avgEngagementTime || 0,
        pageViews: ga4Data.pageViews || 0,
        
        // 电商转化指标
        addToCartEvents: ga4Data.addToCartEvents || 0,
        checkoutEvents: ga4Data.checkoutEvents || 0,
        purchaseEvents: ga4Data.purchaseEvents || 0,
        revenue: ga4Data.revenue || 0,
        
        // Clarity 用户行为指标
        clarityTotalSessions: clarityData.totalSessions || 0,
        clarityTotalUsers: clarityData.totalUsers || 0,
        clarityAvgScrollDepth: clarityData.avgScrollDepth || 0,
        
        // GSC 搜索指标
        gscTotalClicks: gscData.totalClicks || 0,
        gscTotalImpressions: gscData.totalImpressions || 0,
        gscAvgCTR: gscData.avgCTR || 0,
        gscAvgPosition: gscData.avgPosition || 0,
        
        // WooCommerce 订单指标
        wooTotalOrders: wooData.totalOrders || 0,
        wooTotalRevenue: wooData.totalRevenue || 0,
        wooCompletedOrders: wooData.completedOrders || 0,
        wooAbandonedCartRate: wooData.abandonedCartRate || 0,
        wooAvgOrderValue: wooData.avgOrderValue || 0
      },
      
      // 跨平台洞察
      crossPlatformInsights,
      
      // 数据质量指标
      dataQuality: {
        ga4Available: Object.keys(ga4Data).length > 0,
        clarityAvailable: Object.keys(clarityData).length > 0,
        wooAvailable: Object.keys(wooData).length > 0,
        gscAvailable: Object.keys(gscData).length > 0,
        completeness: calculateDataCompleteness(ga4Data, clarityData, wooData, gscData),
        validationReport: dataQualityReport
      },
      
      loadTime: new Date().toISOString(),
      dateRange: `${props.startDate} 至 ${props.endDate}`
    }

    console.log('所有数据加载完成:', aggregatedData)
    return aggregatedData
  } catch (error) {
    console.error('数据加载失败:', error)
    ElMessage.error('数据加载失败: ' + error.message)
    return {}
  }
}

// 日期验证函数
const isValidDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// 计算跨平台洞察
const calculateCrossPlatformInsights = (ga4Data, clarityData, wooData, gscData) => {
  const insights = {}
  
  try {
    // 转化漏斗分析 (GA4 + WooCommerce)
    const ga4Users = ga4Data.totalUsers || 0
    const ga4AddToCarts = ga4Data.addToCartEvents || 0
    const ga4Checkouts = ga4Data.checkoutEvents || 0
    const ga4Purchases = ga4Data.purchaseEvents || 0
    const wooOrders = wooData.totalOrders || 0
    
    insights.conversionFunnel = {
      userToCart: ga4Users > 0 ? (ga4AddToCarts / ga4Users * 100).toFixed(2) : 0,
      cartToCheckout: ga4AddToCarts > 0 ? (ga4Checkouts / ga4AddToCarts * 100).toFixed(2) : 0,
      checkoutToPurchase: ga4Checkouts > 0 ? (ga4Purchases / ga4Checkouts * 100).toFixed(2) : 0,
      overallConversionRate: ga4Users > 0 ? (wooOrders / ga4Users * 100).toFixed(2) : 0
    }
    
    // 用户参与度分析 (GA4 + Clarity)
    const ga4EngagementTime = ga4Data.avgEngagementTime || 0
    const clarityScrollDepth = clarityData.avgScrollDepth || 0
    const ga4BounceRate = ga4Data.bounceRate || 0
    
    insights.userEngagement = {
      engagementScore: calculateEngagementScore(ga4EngagementTime, clarityScrollDepth, ga4BounceRate),
      timeVsScrollCorrelation: analyzeTimeScrollCorrelation(ga4EngagementTime, clarityScrollDepth),
      userQualityIndex: calculateUserQualityIndex(ga4BounceRate, ga4EngagementTime, clarityScrollDepth)
    }
    
    // 流量质量分析 (GA4 + GSC + WooCommerce)
    const gscClicks = gscData.totalClicks || 0
    const ga4Sessions = ga4Data.sessions || 0
    const wooRevenue = wooData.totalRevenue || 0
    
    insights.trafficQuality = {
      organicTrafficShare: ga4Sessions > 0 ? (gscClicks / ga4Sessions * 100).toFixed(2) : 0,
      revenuePerSession: ga4Sessions > 0 ? (wooRevenue / ga4Sessions).toFixed(2) : 0,
      searchVisibilityImpact: analyzeSearchVisibilityImpact(gscData, ga4Data),
      trafficValueScore: calculateTrafficValueScore(ga4Data, gscData, wooData)
    }
    
    // 数据一致性检查
    insights.dataConsistency = {
      userCountDifference: Math.abs((ga4Data.totalUsers || 0) - (clarityData.totalUsers || 0)),
      sessionCountDifference: Math.abs((ga4Data.sessions || 0) - (clarityData.totalSessions || 0)),
      revenueConsistency: compareRevenueSources(ga4Data.revenue, wooData.totalRevenue),
      overallConsistencyScore: calculateConsistencyScore(ga4Data, clarityData, wooData)
    }
    
    // 关键警告和机会
    insights.alertsAndOpportunities = generateAlertsAndOpportunities(ga4Data, clarityData, wooData, gscData)
    
  } catch (error) {
    console.error('跨平台分析计算错误:', error)
    insights.error = '跨平台分析计算失败'
  }
  
  return insights
}

// 数据质量验证函数
const validateDataQuality = (ga4Data, clarityData, wooData, gscData) => {
  const report = {
    ga4Issues: [],
    clarityIssues: [],
    wooIssues: [],
    gscIssues: [],
    criticalIssues: [],
    warningIssues: [],
    overallHealth: 'unknown'
  }

  // GA4 数据验证
  if (ga4Data.totalUsers) {
    // 检查异常大的参与时长（超过24小时=86400秒）
    if (ga4Data.avgEngagementTime > 86400) {
      report.ga4Issues.push(`异常大的参与时长: ${ga4Data.avgEngagementTime}秒 (~${Math.round(ga4Data.avgEngagementTime/86400)}天)`)
      report.criticalIssues.push('GA4 参与时长数据严重异常，可能存在配置错误')
    }
    
    // 检查页面浏览数为0但有用户数
    if (ga4Data.pageViews === 0 && ga4Data.totalUsers > 0) {
      report.ga4Issues.push('页面浏览数为0，但有用户数据，page_view事件可能未正确配置')
      report.criticalIssues.push('GA4 页面浏览事件追踪失效')
    }
    
    // 检查会话数与用户数的比例是否合理（通常会话数 >= 用户数）
    if (ga4Data.sessions > 0 && ga4Data.sessions < ga4Data.totalUsers * 0.8) {
      report.ga4Issues.push(`会话数(${ga4Data.sessions})相对于用户数(${ga4Data.totalUsers})异常偏低`)
      report.warningIssues.push('GA4 会话追踪可能不完整')
    }
    
    // 检查跳出率是否在合理范围内（0-100%）
    if (ga4Data.bounceRate < 0 || ga4Data.bounceRate > 100) {
      report.ga4Issues.push(`跳出率超出合理范围: ${ga4Data.bounceRate}%`)
      report.criticalIssues.push('GA4 跳出率计算错误')
    }
  } else {
    report.ga4Issues.push('未获取到用户数据')
    report.criticalIssues.push('GA4 完全无数据')
  }

  // Clarity 数据验证
  if (!clarityData.totalUsers || clarityData.totalUsers === 0) {
    report.clarityIssues.push('Clarity 未收集到用户数据')
    report.criticalIssues.push('Clarity 追踪代码可能未正确安装')
  } else {
    // 检查滚动深度是否合理
    if (clarityData.avgScrollDepth < 0 || clarityData.avgScrollDepth > 100) {
      report.clarityIssues.push(`滚动深度超出合理范围: ${clarityData.avgScrollDepth}%`)
    }
  }

  // WooCommerce 数据验证
  if (wooData && typeof wooData === 'object') {
    // 检查是否有订单数据
    if (!wooData.totalOrders || wooData.totalOrders === 0) {
      report.wooIssues.push('未获取到订单数据，可能是时间范围内无订单或API配置问题')
    }
    
    // 检查收入数据的合理性
    if (wooData.totalRevenue && wooData.totalOrders && wooData.totalRevenue / wooData.totalOrders < 1) {
      report.wooIssues.push('平均订单价值异常低，请检查货币单位设置')
    }
  } else {
    report.wooIssues.push('WooCommerce API 连接失败或返回数据格式错误')
    report.warningIssues.push('WooCommerce 数据不可用')
  }

  // GSC 数据验证
  if (!gscData.totalClicks || gscData.totalClicks === 0) {
    report.gscIssues.push('未获取到搜索点击数据，可能是时间范围太短或GSC权限问题')
  } else {
    // 检查CTR是否在合理范围内
    if (gscData.avgCTR > 50) {
      report.gscIssues.push(`平均CTR异常高: ${gscData.avgCTR}%，数据可能有误`)
    }
    
    // 检查平均排名是否合理
    if (gscData.avgPosition > 100) {
      report.gscIssues.push(`平均排名过低: ${gscData.avgPosition}，SEO表现需要关注`)
    }
  }

  // 跨平台数据一致性验证
  if (ga4Data.totalUsers && clarityData.totalUsers) {
    const userCountDiff = Math.abs(ga4Data.totalUsers - clarityData.totalUsers) / Math.max(ga4Data.totalUsers, clarityData.totalUsers)
    if (userCountDiff > 0.5) {
      report.criticalIssues.push(`GA4用户数(${ga4Data.totalUsers})与Clarity用户数(${clarityData.totalUsers})差异过大`)
    }
  }

  // 总体健康度评估
  if (report.criticalIssues.length > 0) {
    report.overallHealth = 'critical'
  } else if (report.warningIssues.length > 0) {
    report.overallHealth = 'warning'
  } else if (report.ga4Issues.length === 0 && report.clarityIssues.length === 0) {
    report.overallHealth = 'good'
  } else {
    report.overallHealth = 'fair'
  }

  return report
}

// 计算数据完整性
const calculateDataCompleteness = (ga4Data, clarityData, wooData, gscData) => {
  let score = 0
  let maxScore = 4
  
  if (Object.keys(ga4Data).length > 0 && ga4Data.totalUsers > 0 && ga4Data.pageViews > 0) score += 1
  if (Object.keys(clarityData).length > 0 && clarityData.totalUsers > 0) score += 1
  if (Object.keys(wooData).length > 0) score += 1
  if (Object.keys(gscData).length > 0 && gscData.totalClicks > 0) score += 1
  
  return Math.round((score / maxScore) * 100)
}

// 辅助分析函数
const calculateEngagementScore = (engagementTime, scrollDepth, bounceRate) => {
  // 综合评分：参与时长(40%) + 滚动深度(40%) + 跳出率(20%)
  const timeScore = Math.min(engagementTime / 120, 1) * 40 // 2分钟为满分
  const scrollScore = (scrollDepth / 100) * 40
  const bounceScore = (1 - bounceRate / 100) * 20
  return Math.round(timeScore + scrollScore + bounceScore)
}

const analyzeTimeScrollCorrelation = (engagementTime, scrollDepth) => {
  if (engagementTime === 0 || scrollDepth === 0) return '数据不足'
  const ratio = scrollDepth / (engagementTime / 10) // 每10秒滚动百分比
  if (ratio > 3) return '快速浏览型'
  if (ratio > 1) return '正常浏览型'
  return '深度阅读型'
}

const calculateUserQualityIndex = (bounceRate, engagementTime, scrollDepth) => {
  const bounceScore = (100 - bounceRate) / 100
  const timeScore = Math.min(engagementTime / 180, 1) // 3分钟为满分
  const scrollScore = scrollDepth / 100
  return Math.round((bounceScore * 0.3 + timeScore * 0.4 + scrollScore * 0.3) * 100)
}

const analyzeSearchVisibilityImpact = (gscData, ga4Data) => {
  const avgPosition = gscData.avgPosition || 0
  const ctr = gscData.avgCTR || 0
  const organicImpact = ga4Data.sessions > 0 ? (gscData.totalClicks / ga4Data.sessions * 100) : 0
  
  return {
    positionQuality: avgPosition <= 3 ? '优秀' : avgPosition <= 10 ? '良好' : '待提升',
    ctrPerformance: ctr >= 5 ? '优秀' : ctr >= 2 ? '良好' : '待提升',
    organicTrafficShare: `${organicImpact.toFixed(1)}%`
  }
}

const calculateTrafficValueScore = (ga4Data, gscData, wooData) => {
  const revenuePerUser = ga4Data.totalUsers > 0 ? (wooData.totalRevenue || 0) / ga4Data.totalUsers : 0
  const organicValue = gscData.totalClicks > 0 ? (wooData.totalRevenue || 0) / gscData.totalClicks : 0
  return Math.round(Math.min(revenuePerUser * 10, 100)) // 标准化到100分
}

const compareRevenueSources = (ga4Revenue, wooRevenue) => {
  if (!ga4Revenue || !wooRevenue) return '数据不足'
  const difference = Math.abs(ga4Revenue - wooRevenue) / Math.max(ga4Revenue, wooRevenue)
  if (difference < 0.1) return '高度一致'
  if (difference < 0.3) return '基本一致'
  return '存在差异'
}

const calculateConsistencyScore = (ga4Data, clarityData, wooData) => {
  let score = 100
  
  // 用户数差异
  const userDiff = Math.abs((ga4Data.totalUsers || 0) - (clarityData.totalUsers || 0))
  const userBase = Math.max(ga4Data.totalUsers || 0, clarityData.totalUsers || 0)
  if (userBase > 0) {
    score -= Math.min((userDiff / userBase) * 50, 30)
  }
  
  // 收入数据差异
  const ga4Revenue = ga4Data.revenue || 0
  const wooRevenue = wooData.totalRevenue || 0
  if (ga4Revenue > 0 && wooRevenue > 0) {
    const revenueDiff = Math.abs(ga4Revenue - wooRevenue) / Math.max(ga4Revenue, wooRevenue)
    score -= Math.min(revenueDiff * 30, 20)
  }
  
  return Math.round(Math.max(score, 0))
}

const generateAlertsAndOpportunities = (ga4Data, clarityData, wooData, gscData) => {
  const alerts = []
  const opportunities = []
  
  // 检查警告
  if ((ga4Data.bounceRate || 0) > 70) {
    alerts.push('跳出率过高，需要优化页面内容和用户体验')
  }
  
  if ((clarityData.avgScrollDepth || 0) < 50) {
    alerts.push('用户滚动深度较低，内容可能不够吸引人')
  }
  
  if ((wooData.abandonedCartRate || 0) > 70) {
    alerts.push('购物车放弃率过高，需要优化结账流程')
  }
  
  if ((gscData.avgPosition || 0) > 10) {
    alerts.push('搜索排名较低，需要加强SEO优化')
  }
  
  // 检查机会
  if ((gscData.avgCTR || 0) < 3 && (gscData.avgPosition || 0) <= 5) {
    opportunities.push('搜索排名良好但点击率偏低，可优化标题和描述')
  }
  
  if ((ga4Data.addToCartEvents || 0) > 0 && (ga4Data.checkoutEvents || 0) / (ga4Data.addToCartEvents || 1) < 0.3) {
    opportunities.push('加购到结账转化率偏低，可优化购物车页面')
  }
  
  if ((clarityData.avgScrollDepth || 0) > 80 && (ga4Data.avgEngagementTime || 0) > 120) {
    opportunities.push('用户参与度很高，可以增加更多相关产品推荐')
  }
  
  return { alerts, opportunities }
}

const loadGA4Data = async () => {
  try {
    console.log('加载GA4数据...')
    
    // 基础指标报告
    const basicMetrics = await ga4Client.runReport({
      dateRanges: [{ startDate: props.startDate, endDate: props.endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' },      // 用户活跃参与时长
        { name: 'engagedSessions' },             // 有效会话数
        { name: 'averageEngagementTime' }        // 平均参与时间（更接近传统停留时长）
      ]
    })

    // 页面级别的停留时长数据
    const pageEngagementMetrics = await ga4Client.runReport({
      dateRanges: [{ startDate: props.startDate, endDate: props.endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' },
        { name: 'bounceRate' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    }).catch(() => ({ rows: [] }))

    // 电商转化指标
    const ecommerceMetrics = await ga4Client.runReport({
      dateRanges: [{ startDate: props.startDate, endDate: props.endDate }],
      metrics: [
        { name: 'addToCarts' },
        { name: 'checkouts' },
        { name: 'purchases' },
        { name: 'purchaseRevenue' }
      ]
    }).catch(() => ({ rows: [{ metricValues: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }] }] }))

    // 流量来源数据
    const trafficSources = await ga4Client.runReport({
      dateRanges: [{ startDate: props.startDate, endDate: props.endDate }],
      dimensions: [{ name: 'firstUserSource' }, { name: 'firstUserMedium' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10
    }).catch(() => ({ rows: [] }))

    console.log('GA4 原始数据:', { basicMetrics, pageEngagementMetrics, ecommerceMetrics, trafficSources })

    return {
      basicMetrics,
      pageEngagementMetrics,
      ecommerceMetrics,
      trafficSources,
      // 处理后的数据
      totalUsers: parseInt(basicMetrics?.rows?.[0]?.metricValues?.[0]?.value || 0),
      sessions: parseInt(basicMetrics?.rows?.[0]?.metricValues?.[1]?.value || 0),
      bounceRate: parseFloat(basicMetrics?.rows?.[0]?.metricValues?.[2]?.value || 0) * 100,
      pageViews: parseInt(basicMetrics?.rows?.[0]?.metricValues?.[3]?.value || 0),
      userEngagementDuration: parseInt(basicMetrics?.rows?.[0]?.metricValues?.[4]?.value || 0),
      engagedSessions: parseInt(basicMetrics?.rows?.[0]?.metricValues?.[5]?.value || 0),
      avgEngagementTime: parseFloat(basicMetrics?.rows?.[0]?.metricValues?.[6]?.value || 0), // 这个更接近传统停留时长
      addToCartEvents: parseInt(ecommerceMetrics?.rows?.[0]?.metricValues?.[0]?.value || 0),
      checkoutEvents: parseInt(ecommerceMetrics?.rows?.[0]?.metricValues?.[1]?.value || 0),
      purchaseEvents: parseInt(ecommerceMetrics?.rows?.[0]?.metricValues?.[2]?.value || 0),
      revenue: parseFloat(ecommerceMetrics?.rows?.[0]?.metricValues?.[3]?.value || 0),
      // 页面停留时长分析
      topPages: pageEngagementMetrics?.rows?.map(row => ({
        page: row.dimensionValues[0].value,
        pageViews: parseInt(row.metricValues[0].value || 0),
        avgTimeOnPage: parseInt(row.metricValues[1].value || 0), // 页面停留时长
        bounceRate: parseFloat(row.metricValues[2].value || 0) * 100
      })) || []
    }
  } catch (error) {
    console.error('GA4 数据加载错误:', error)
    return {}
  }
}

const loadClarityData = async () => {
  try {
    console.log('加载Clarity数据...')
    
    // 获取滚动深度数据
    const scrollDepthData = await clarityClient.getScrollDepthMetrics(1)
    
    console.log('Clarity 原始数据:', scrollDepthData)

    return {
      scrollDepthData,
      // 处理后的指标 - 使用更安全的数据提取
      avgScrollDepth: scrollDepthData?.avgScrollDepth || 
                     scrollDepthData?.data?.[0]?.AverageScrollDepth || 0,
      totalSessions: scrollDepthData?.totalSessions || 
                    scrollDepthData?.data?.[0]?.Sessions || 0,
      totalUsers: scrollDepthData?.totalUsers || 
                 scrollDepthData?.data?.[0]?.Users || 0
    }
  } catch (error) {
    console.error('Clarity 数据加载错误:', error)
    return {}
  }
}

const loadWooData = async () => {
  try {
    console.log('加载WooCommerce数据...')
    
    const orderAnalytics = await getOrderAnalytics(props.startDate, props.endDate)
    
    console.log('WooCommerce 原始数据:', orderAnalytics)
    
    return orderAnalytics || {}
  } catch (error) {
    console.error('WooCommerce 数据加载错误:', error)
    return {}
  }
}

const loadGSCData = async () => {
  try {
    console.log('加载GSC数据...')
    
    // 搜索查询数据
    const queryData = await fetchSearchData(props.startDate, props.endDate, 'query')
    
    console.log('GSC 原始数据:', queryData)

    // 计算汇总指标
    const totalClicks = queryData.rows?.reduce((sum, row) => sum + (row.clicks || 0), 0) || 0
    const totalImpressions = queryData.rows?.reduce((sum, row) => sum + (row.impressions || 0), 0) || 0
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0
    const avgPosition = queryData.rows?.length > 0 
      ? queryData.rows.reduce((sum, row) => sum + (row.position || 0), 0) / queryData.rows.length 
      : 0

    return {
      queryData,
      // 汇总指标
      totalClicks,
      totalImpressions,
      avgCTR,
      avgPosition
    }
  } catch (error) {
    console.error('GSC 数据加载错误:', error)
    return {}
  }
}



// AI分析方法
const analyzeHealth = async () => {
  if (!isGeminiConfigured.value) {
    ElMessage.warning('请配置Gemini API Key')
    return
  }
  
  analyzingHealth.value = true
  try {
    // 检查数据质量，如果有严重问题，提供数据修复建议而非常规分析
    const dataQuality = businessData.value.dataQuality?.validationReport
    if (dataQuality?.overallHealth === 'critical') {
      healthAnalysis.value = await geminiClient.generateDataDiagnosisReport(businessData.value)
    } else {
      healthAnalysis.value = await geminiClient.analyzeWebsiteHealth(businessData.value)
    }
  } catch (error) {
    console.error('AI分析错误:', error)
    ElMessage.error('AI分析失败: ' + error.message)
  } finally {
    analyzingHealth.value = false
  }
}

const analyzeFunnel = async () => {
  if (!isGeminiConfigured.value) return
  
  analyzingFunnel.value = true
  try {
    const analysis = await geminiClient.analyzeConversionFunnel(businessData.value)
    funnelAnalysis.value = analysis
  } catch (error) {
    ElMessage.error('AI分析失败')
  } finally {
    analyzingFunnel.value = false
  }
}

const analyzeChannels = async () => {
  if (!isGeminiConfigured.value) return
  
  analyzingChannels.value = true
  try {
    const analysis = await geminiClient.analyzeTrafficChannels(businessData.value)
    channelsAnalysis.value = analysis
  } catch (error) {
    ElMessage.error('AI分析失败')
  } finally {
    analyzingChannels.value = false
  }
}

const analyzeBehavior = async () => {
  if (!isGeminiConfigured.value) return
  
  analyzingBehavior.value = true
  try {
    const analysis = await geminiClient.analyzeUserBehavior(businessData.value)
    behaviorAnalysis.value = analysis
  } catch (error) {
    ElMessage.error('AI分析失败')
  } finally {
    analyzingBehavior.value = false
  }
}

const generateInsights = async () => {
  if (!isGeminiConfigured.value) return
  
  analyzingComprehensive.value = true
  try {
    const insights = await geminiClient.generateComprehensiveInsights(businessData.value)
    comprehensiveInsights.value = insights
  } catch (error) {
    ElMessage.error('AI分析失败')
  } finally {
    analyzingComprehensive.value = false
  }
}

const toggleDataPreview = () => {
  showDataPreview.value = !showDataPreview.value
}

const formatAnalysisResult = (text) => {
  if (!text) return ''
  
  // 将文本转换为HTML格式，增强可读性
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/(\d+\.\s)/g, '<br><strong>$1</strong>')
    .replace(/(###\s.*)/g, '<h4>$1</h4>')
    .replace(/(##\s.*)/g, '<h3>$1</h3>')
}

onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.data-insights {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: var(--bg-primary);
    border-radius: 8px;

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  .data-preview {
    margin-bottom: 20px;
    
    .data-json {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 6px;
      font-size: 12px;
      max-height: 400px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  .config-notice {
    margin-bottom: 20px;
  }

  .data-quality-alerts {
    margin-bottom: 20px;

    .alert-content {
      ul {
        margin: 10px 0;
        padding-left: 20px;
      }

      li {
        margin: 5px 0;
        line-height: 1.5;
      }

      p {
        margin: 8px 0;
      }
    }
  }

  .tab-content {
    padding: 20px;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .metric-card {
      background: var(--bg-secondary);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid transparent;

      &.health { border-color: #67c23a; }
      &.engagement { border-color: #409eff; }
      &.conversion { border-color: #e6a23c; }
      &.data-quality { border-color: #909399; }

      .metric-title {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .metric-value {
        font-size: 32px;
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: 8px;
      }

      .metric-desc {
        font-size: 12px;
        color: var(--text-secondary);
        opacity: 0.8;
      }
    }
  }

  .page-engagement-section {
    background: rgba(103, 194, 58, 0.1);
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
    border-left: 4px solid #67C23A;

    h4 {
      margin: 0 0 20px 0;
      color: #67C23A;
      font-size: 18px;
      font-weight: 600;
    }

    h5 {
      margin: 20px 0 12px 0;
      color: #409EFF;
      font-size: 16px;
      font-weight: 500;
    }

    .engagement-metric {
      background: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);

      .metric-title {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .metric-value {
        font-size: 28px;
        font-weight: 600;
        color: #67C23A;
        margin-bottom: 6px;
      }

      .metric-desc {
        font-size: 12px;
        color: var(--text-secondary);
        opacity: 0.8;
      }
    }

    .top-pages-section {
      margin-top: 20px;
    }
  }

  .insights-overview {
    background: var(--bg-secondary);
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;

    h4 {
      margin: 0 0 15px 0;
      color: var(--text-primary);
      font-size: 16px;
    }

    .insight-item {
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      strong {
        color: var(--text-primary);
        margin-right: 8px;
      }

      span {
        color: var(--text-secondary);
      }
    }
  }

  .chart {
    height: 300px;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .analysis-result {
    margin-top: 20px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
    white-space: pre-wrap;
    line-height: 1.6;
  }
}
</style> 