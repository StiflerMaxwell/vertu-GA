import { db } from './config'
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore'

export const performanceService = {
  // 记录性能测试数据
  async logPerformanceMetrics(metrics) {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()

      // 获取设备类型
      const device = window.innerWidth <= 768 ? 'mobile' : 'desktop'

      await addDoc(collection(db, 'performanceMetrics'), {
        // 性能指标
        metrics: {
          performance: metrics.performance, // 性能得分
          fcp: metrics.fcp,                // First Contentful Paint
          lcp: metrics.lcp,                // Largest Contentful Paint
          cls: metrics.cls,                // Cumulative Layout Shift
          tbt: metrics.tbt,                // Total Blocking Time
        },
        // 设备和环境信息
        device,
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        ip: ipData.ip,
        // 时间信息
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      console.error('Performance logging error:', error)
    }
  },

  // 获取历史性能数据
  async getPerformanceHistory(limit = 100) {
    try {
      const q = query(
        collection(db, 'performanceMetrics'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // 确保 timestamp 是有效的日期对象
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }))
    } catch (error) {
      console.error('Get performance history error:', error)
      return []
    }
  }
} 