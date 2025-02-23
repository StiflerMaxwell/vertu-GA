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
  Timestamp,
  addDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './config'

export const statsService = {
  // 获取今日调用次数
  async getTodayCallCount() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const q = query(
        collection(db, 'api_stats'),
        where('date', '>=', today)
      )
      
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        return snapshot.docs[0].data().callCount || 0
      }
      
      // 如果没有今天的记录，创建一个新记录
      await this.createTodayStats()
      return 0
    } catch (error) {
      console.error('Get call count error:', error)
      return 0
    }
  },

  // 创建今天的统计记录
  async createTodayStats() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      await addDoc(collection(db, 'api_stats'), {
        date: today,
        callCount: 0,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Create stats error:', error)
    }
  },

  // 更新API调用统计
  async updateApiCallStats() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const q = query(
        collection(db, 'api_stats'),
        where('date', '>=', today)
      )
      
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        // 更新今天的记录
        const docRef = doc(db, 'api_stats', snapshot.docs[0].id)
        const currentCount = snapshot.docs[0].data().callCount || 0
        await updateDoc(docRef, {
          callCount: currentCount + 1,
          lastUpdated: serverTimestamp()
        })
        return currentCount + 1
      } else {
        // 创建今天的记录
        await addDoc(collection(db, 'api_stats'), {
          date: today,
          callCount: 1,
          timestamp: serverTimestamp(),
          lastUpdated: serverTimestamp()
        })
        return 1
      }
    } catch (error) {
      console.error('Update API stats error:', error)
      throw error
    }
  },

  // 检查是否超过每日限制
  async checkDailyLimit(limit = 100) {
    try {
      const count = await this.getTodayCallCount()
      return count >= limit
    } catch (error) {
      console.error('Check limit error:', error)
      return true // 出错时保守处理，认为已达到限制
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