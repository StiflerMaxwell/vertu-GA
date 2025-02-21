import { 
  collection, 
  doc,
  increment,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore'
import { db } from './config'

export const statsService = {
  // 更新每日 API 调用统计
  async updateApiCallStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const statsRef = doc(db, 'apiStats', today.toISOString().split('T')[0])
    
    try {
      await setDoc(statsRef, {
        date: Timestamp.fromDate(today),
        calls: increment(1),
        lastUpdated: Timestamp.now()
      }, { merge: true })
    } catch (error) {
      console.error('Stats update error:', error)
    }
  },

  // 获取今日 API 调用次数
  async getTodayCallCount() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    try {
      const statsRef = doc(db, 'apiStats', today.toISOString().split('T')[0])
      const snapshot = await getDoc(statsRef)
      
      if (snapshot.exists()) {
        return snapshot.data().calls || 0
      }
      return 0
    } catch (error) {
      console.error('Get today stats error:', error)
      return 0
    }
  },

  // 获取缓存命中率
  async getCacheHitRate() {
    try {
      const q = query(
        collection(db, 'apiStats'),
        orderBy('date', 'desc'),
        limit(7)
      )
      
      const snapshot = await getDocs(q)
      const stats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return stats
    } catch (error) {
      console.error('Get cache stats error:', error)
      return []
    }
  }
} 