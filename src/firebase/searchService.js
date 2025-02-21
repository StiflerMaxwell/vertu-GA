import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit 
} from 'firebase/firestore'
import { db } from './config'
import { searchContent } from '../api/googleSearch'
import { statsService } from './statsService'

export const searchService = {
  // 生成缓存键
  generateCacheKey(searchQuery, options) {
    return `${searchQuery}_${options.lr}_${options.dateRestrict}_${options.sort}_${options.start}`
  },

  // 检查缓存
  async checkCache(searchQuery, options) {
    try {
      const cacheKey = this.generateCacheKey(searchQuery, options)
      const q = query(
        collection(db, 'searchResults'),
        where('cacheKey', '==', cacheKey),
        where('expiryTime', '>', new Date()),
        orderBy('expiryTime'),
        limit(1)
      )
      
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        return { ...doc.data(), id: doc.id }
      }
      return null
    } catch (error) {
      console.error('Cache check error:', error)
      return null
    }
  },

  // 保存到缓存
  async saveToCache(searchQuery, options, results) {
    try {
      const cacheKey = this.generateCacheKey(searchQuery, options)
      const now = new Date()
      
      // 设置缓存过期时间（24小时）
      const expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      await addDoc(collection(db, 'searchResults'), {
        cacheKey,
        searchQuery,
        options,
        results,
        timestamp: serverTimestamp(),
        expiryTime
      })
    } catch (error) {
      console.error('Cache save error:', error)
    }
  },

  // 执行搜索
  async search(searchQuery, options) {
    // 先检查缓存
    const cachedResults = await this.checkCache(searchQuery, options)
    if (cachedResults) {
      console.log('Cache hit:', searchQuery)
      return cachedResults.results
    }

    // 缓存未命中，调用 API
    console.log('Cache miss:', searchQuery)
    // 更新 API 调用统计
    await statsService.updateApiCallStats()
    
    const results = await searchContent(searchQuery, options)
    
    // 保存到缓存
    await this.saveToCache(searchQuery, options, results)
    
    return results
  }
} 