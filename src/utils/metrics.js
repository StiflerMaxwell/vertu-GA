// 将所有函数包装在一个对象中默认导出
const metrics = {
  // 计算跳出率
  calculateBounceRate(data) {
    if (!data || data.length === 0) return 0
    
    const bounces = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'bounces')?.value || 0)
    }, 0)
    
    const sessions = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'sessions')?.value || 0)
    }, 0)
    
    return sessions ? bounces / sessions : 0
  },

  // 计算转化率
  calculateConversionRate(data) {
    if (!data || data.length === 0) return 0
    
    const conversions = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'conversions')?.value || 0)
    }, 0)
    
    const users = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'totalUsers')?.value || 0)
    }, 0)
    
    return users ? conversions / users : 0
  },

  // 计算平均会话时长
  calculateAvgSessionDuration(data) {
    if (!data || data.length === 0) return 0
    
    const totalDuration = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'userEngagementDuration')?.value || 0)
    }, 0)
    
    const sessions = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'sessions')?.value || 0)
    }, 0)
    
    return sessions ? totalDuration / sessions : 0
  },

  // 计算平均页面深度
  calculateAvgPageDepth(data) {
    if (!data || data.length === 0) return 0
    
    const pageviews = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'screenPageViews')?.value || 0)
    }, 0)
    
    const sessions = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'sessions')?.value || 0)
    }, 0)
    
    return sessions ? pageviews / sessions : 0
  },

  // 计算页面加载时间
  calculatePageLoadTime(data) {
    if (!data || data.length === 0) return 0
    
    const totalLoadTime = data.reduce((sum, item) => {
      return sum + Number(item.metricValues.find(m => m.name === 'averagePageLoadTime')?.value || 0)
    }, 0)
    
    return totalLoadTime / data.length
  },

  // 分析性能瓶颈
  analyzePerformanceBottlenecks(data) {
    const bottlenecks = []
    if (!data || data.length === 0) return bottlenecks
    
    const lastEntry = data[data.length - 1]
    if (!lastEntry) return bottlenecks
    
    const loadTime = Number(lastEntry.metricValues.find(m => m.name === 'averagePageLoadTime')?.value || 0)
    const firstContentfulPaint = Number(lastEntry.metricValues.find(m => m.name === 'firstContentfulPaint')?.value || 0)
    
    if (loadTime > 3) bottlenecks.push('页面加载时间过长')
    if (firstContentfulPaint > 1.5) bottlenecks.push('首次内容绘制时间过长')
    
    return bottlenecks
  },

  // 生成性能优化步骤
  generatePerformanceOptimizations(bottlenecks) {
    const steps = []
    
    if (bottlenecks.includes('页面加载时间过长')) {
      steps.push(
        '优化图片资源（压缩、懒加载）',
        '压缩和合并 JavaScript/CSS 文件',
        '使用浏览器缓存',
        '启用 Gzip 压缩'
      )
    }
    
    if (bottlenecks.includes('首次内容绘制时间过长')) {
      steps.push(
        '优化关键渲染路径',
        '预加载关键资源',
        '减少首屏阻塞资源'
      )
    }
    
    return steps
  },

  // 分析转化漏斗
  analyzeConversionFunnel(data) {
    if (!data || data.length === 0) return {
      mobileConversion: 0,
      desktopConversion: 0,
      mobileAbandonRate: 0,
      dropoffPoints: [],
      optimizationSteps: []
    }

    // 示例返回值
    return {
      mobileConversion: 0.015,
      desktopConversion: 0.025,
      mobileAbandonRate: 0.35,
      dropoffPoints: ['购物车页面', '支付流程', '表单填写'],
      optimizationSteps: [
        '简化移动端结账流程',
        '优化表单字段和验证',
        '提供更多支付选项',
        '添加购物进度提示'
      ]
    }
  }
}

export default metrics 