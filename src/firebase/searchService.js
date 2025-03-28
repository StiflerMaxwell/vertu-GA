import { db } from './config'
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
import { searchContent } from '../api/googleSearch'
import { statsService } from './statsService'

export const searchService = {
  // 生成缓存键
  generateCacheKey(searchQuery, options) {
    // 对象按字母顺序排序键，以确保相同选项生成相同的键
    const { lr, dateRestrict, sort, num } = options
    // 为了更好地区分不同查询，但不区分分页，移除 start 参数
    return `${searchQuery}_${lr}_${dateRestrict}_${sort}_${num}`
  },

  // 检查今天是否已经刷新过数据
  async hasRefreshedToday(searchQuery, options) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const q = query(
        collection(db, 'search_refreshes'),
        where('date', '>=', today),
        where('searchQuery', '==', searchQuery),
        where('options.lr', '==', options.lr),
        where('options.dateRestrict', '==', options.dateRestrict),
        where('options.sort', '==', options.sort)
      )

      const snapshot = await getDocs(q)
      return !snapshot.empty
    } catch (error) {
      console.error('Check refresh status error:', error)
      return false
    }
  },

  // 记录今天已刷新
  async markAsRefreshedToday(searchQuery, options) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await addDoc(collection(db, 'search_refreshes'), {
        searchQuery,
        options: {
          lr: options.lr,
          dateRestrict: options.dateRestrict,
          sort: options.sort
        },
        date: today,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Mark refresh error:', error)
    }
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
      
      // 根据内容时效性设置不同的缓存过期时间
      let expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 默认缓存24小时
      
      // 对于热门/时效性内容，缓存时间短一些
      if (options.dateRestrict === 'd1') {
        // 1天内的内容缓存4小时
        expiryTime = new Date(now.getTime() + 4 * 60 * 60 * 1000)
      } else if (options.dateRestrict === 'w1') {
        // 1周内的内容缓存12小时
        expiryTime = new Date(now.getTime() + 12 * 60 * 60 * 1000)
      } else if (options.dateRestrict === 'm1') {
        // 1个月内的内容缓存18小时
        expiryTime = new Date(now.getTime() + 18 * 60 * 60 * 1000)
      } else if (options.dateRestrict === 'y1') {
        // 1年内的内容缓存24小时
        expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      } else {
        // 全部时间的内容缓存36小时
        expiryTime = new Date(now.getTime() + 36 * 60 * 60 * 1000)
      }

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
      
      console.log(`缓存已保存，有效期至: ${expiryTime.toLocaleString()}`)
    } catch (error) {
      console.error('Cache save error:', error)
    }
  },

  // 获取最新的搜索结果（不调用API）
  async getLatestResults(searchQuery, options) {
    try {
      const cacheKey = this.generateCacheKey(searchQuery, options)
      const start = options.start || 1
      const pageSize = options.num || 10
      
      console.log(`尝试获取缓存数据 - 查询: ${searchQuery}, 起始位置: ${start}, 页大小: ${pageSize}`)
      
      // 获取该搜索的最新缓存
      const q = query(
        collection(db, 'search_results'),
        where('searchQuery', '==', searchQuery),
        where('options.lr', '==', options.lr),
        where('options.dateRestrict', '==', options.dateRestrict),
        where('options.sort', '==', options.sort),
        where('expiryTime', '>', new Date()),
        orderBy('expiryTime', 'desc'),
        limit(1)
      )
      
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const doc = snapshot.docs[0].data()
        const allItems = doc.results.items || []
        
        console.log(`找到缓存数据 - 总条目数: ${allItems.length}, 页码: ${(start-1)/pageSize + 1}`)
        
        // 计算需要的分页数据
        const startIndex = (start - 1)
        const endIndex = startIndex + pageSize
        
        // 检查是否有足够的数据用于分页
        if (startIndex < allItems.length) {
          // 有数据可供分页，提取需要的数据
          const pagedItems = allItems.slice(startIndex, Math.min(endIndex, allItems.length))
          
          console.log(`提取分页数据 - 起始索引: ${startIndex}, 结束索引: ${endIndex}, 提取条目数: ${pagedItems.length}`)
          
          // 如果能获取到分页数据，则返回
          if (pagedItems.length > 0) {
            return {
              ...doc.results,
              items: pagedItems,
              fromCache: true,
              cacheTimestamp: doc.timestamp,
              cachedPage: (start-1)/pageSize + 1
            }
          }
        }
        
        console.log(`缓存中没有足够的数据用于分页 - 请求页起始位置: ${start}, 缓存数据总量: ${allItems.length}`)
        // 没有足够的数据，需要进行API调用
        return null
      }
      
      console.log('未找到匹配的缓存数据')
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
      // 如果不是强制刷新，先检查缓存
      if (!forceRefresh) {
        const cachedResults = await this.checkCache(searchQuery, options)
        if (cachedResults) {
          console.log('Using cached results:', searchQuery, options)
          return cachedResults
        }
      }

      // 检查是否是今天第一次请求，如果不是强制刷新且已经刷新过，尝试使用最新缓存
      if (!forceRefresh && await this.hasRefreshedToday(searchQuery, options)) {
        const latestResults = await this.checkCache(searchQuery, options)
        if (latestResults) {
          console.log('Today already refreshed, using latest cache:', searchQuery, options)
          return latestResults
        }
      }

      // 检查API调用次数限制
      const isLimitReached = await statsService.checkDailyLimit()
      if (isLimitReached) {
        throw new Error('Daily API call limit reached (100)')
      }

      console.log('Getting fresh search results:', searchQuery, options)
      const results = await searchContent(searchQuery, options)
      
      // 更新API调用统计和缓存
      await statsService.updateApiCallStats()
      await this.saveToCache(searchQuery, options, results)
      
      // 如果不是强制刷新，标记今天已刷新过
      if (!forceRefresh) {
        await this.markAsRefreshedToday(searchQuery, options)
      }
      
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