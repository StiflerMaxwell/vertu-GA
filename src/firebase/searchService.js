import { db } from './config'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore'
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
      const now = new Date()
      
      const q = query(
        collection(db, 'search_results'),
        where('cacheKey', '==', cacheKey),
        where('expiryTime', '>', now)
      )
      
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const doc = snapshot.docs[0].data()
        return {
          ...doc.results,
          fromCache: true,
          cacheTimestamp: doc.timestamp
        }
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
      // 设置缓存过期时间为24小时
      const expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      await addDoc(collection(db, 'search_results'), {
        cacheKey,
        searchQuery,
        options,
        results,
        timestamp: serverTimestamp(),
        expiryTime,
        device: window.innerWidth <= 768 ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent
      })
    } catch (error) {
      console.error('Cache save error:', error)
    }
  },

  // 获取最新的搜索结果（不调用API）
  async getLatestResults(searchQuery, options) {
    try {
      const cacheKey = this.generateCacheKey(searchQuery, options)
      const q = query(
        collection(db, 'search_results'),
        where('cacheKey', '==', cacheKey),
        where('expiryTime', '>', new Date())
      )
      
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const doc = snapshot.docs[0].data()
        return {
          ...doc.results,
          fromCache: true,
          cacheTimestamp: doc.timestamp
        }
      }
      return null
    } catch (error) {
      console.error('Get latest results error:', error)
      return null
    }
  },

  // 执行搜索
  async search(searchQuery, options, forceRefresh = false) {
    if (!searchQuery.trim()) {
      return { items: [], searchInfo: {} }
    }

    try {
      // 如果不是强制刷新，先尝试获取缓存数据
      if (!forceRefresh) {
        const cachedResults = await this.getLatestResults(searchQuery, options)
        if (cachedResults) {
          console.log('Using cached results:', searchQuery)
          return cachedResults
        }
      }

      // 只有在强制刷新或没有缓存数据时才调用 API
      const isLimitReached = await statsService.checkDailyLimit()
      if (isLimitReached) {
        throw new Error('Daily API call limit reached')
      }

      console.log('Fetching new results:', searchQuery)
      const results = await searchContent(searchQuery, options)
      
      await statsService.updateApiCallStats()
      await this.saveToCache(searchQuery, options, results)
      
      return {
        ...results,
        fromCache: false,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }
} 