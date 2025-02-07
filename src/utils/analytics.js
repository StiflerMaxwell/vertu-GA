export class AnalyticsInsight {
  static analyzeData(data) {
    if (!data?.rows) {
      return {
        userInsights: [],
        pageInsights: [],
        recommendations: []
      }
    }

    // 按时间排序数据
    const sortedRows = data.rows.slice().sort((a, b) => 
      a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value)
    );

    // 构造数据结构
    const analyticsData = {
      userMetrics: sortedRows.map(row => Number(row.metricValues[0].value)),
      pageViews: sortedRows.map(row => Number(row.metricValues[1].value)),
      bounceRate: Number(sortedRows[sortedRows.length - 1].metricValues[3].value),
      totalUsers: sortedRows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0),
      averageDuration: Number(sortedRows[sortedRows.length - 1].metricValues[2].value)
    }

    return {
      userInsights: this.analyzeUserTrends(analyticsData),
      pageInsights: this.analyzePagePerformance(analyticsData),
      recommendations: this.generateRecommendations(analyticsData)
    }
  }

  static analyzeUserTrends(data) {
    const insights = []
    
    if (data.userMetrics && data.userMetrics.length > 0) {
      const userTrend = this.calculateTrend(data.userMetrics)
      if (userTrend > 5) {
        insights.push({
          type: 'success',
          title: '用户增长趋势',
          message: `近期用户量呈上升趋势，增长了${userTrend}%`
        })
      } else if (userTrend < -5) {
        insights.push({
          type: 'warning',
          title: '用户量下降',
          message: `近期用户量有所下降，减少了${Math.abs(userTrend)}%，建议分析原因`
        })
      }

      // 添加用户活跃度分析
      const avgUsers = this.average(data.userMetrics);
      if (data.userMetrics[data.userMetrics.length - 1] > avgUsers * 1.2) {
        insights.push({
          type: 'success',
          title: '用户活跃度高',
          message: '当前用户活跃度高于平均水平'
        })
      }
    }

    return insights
  }

  static analyzePagePerformance(data) {
    const insights = []
    
    // 分析跳出率
    if (data.bounceRate > 0.4) {
      insights.push({
        type: 'warning',
        title: '跳出率偏高',
        message: `当前跳出率为${(data.bounceRate * 100).toFixed(1)}%，建议优化页面内容和用户体验`
      })
    }

    // 分析平均访问时长
    if (data.averageDuration < 60) {
      insights.push({
        type: 'info',
        title: '访问时长偏短',
        message: '用户平均访问时长较短，建议增加内容吸引力'
      })
    }

    return insights
  }

  static generateRecommendations(data) {
    const recommendations = []
    
    // 基于数据生成建议
    if (data.mobileUsers && data.totalUsers && 
        (data.mobileUsers / data.totalUsers > 0.6)) {
      recommendations.push({
        type: 'info',
        title: '移动端优化建议',
        message: '移动端用户占比较高，建议优化移动端体验',
        details: ['检查移动端响应式设计', '优化页面加载速度', '简化移动端导航']
      })
    }

    return recommendations
  }

  static calculateTrend(data) {
    if (!Array.isArray(data) || data.length < 7) {
      return 0
    }
    
    // 使用最近7天的数据计算趋势
    const latest = data.slice(-7);
    const latestAvg = this.average(latest);
    const previousAvg = this.average(data.slice(-14, -7));
    
    if (previousAvg === 0) return 0;
    return Number(((latestAvg - previousAvg) / previousAvg * 100).toFixed(1));
  }

  static average(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((a, b) => a + b, 0) / array.length;
  }
} 