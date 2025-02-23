import { db } from './config'
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'

const COLLECTION_NAME = 'performance_metrics'

export const performanceService = {
  // 记录性能测试数据
  async logPerformanceMetrics(metrics, url) {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        metrics,
        url,
        device: window.innerWidth <= 768 ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Performance logging error:', error)
      throw error
    }
  },

  // 获取历史性能数据
  async getPerformanceHistory(limitCount = 50) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }))
    } catch (error) {
      console.error('Get performance history error:', error)
      return []
    }
  },

  // 记录搜索性能数据
  async logSearchPerformance(searchQuery, metrics, results) {
    try {
      await addDoc(collection(db, 'searchMetrics'), {
        searchQuery,
        metrics,
        resultCount: results.searchInfo?.totalResults || 0,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Search performance logging error:', error)
    }
  }
} 