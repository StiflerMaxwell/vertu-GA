<template>
  <el-card class="alerts-feed">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <h3 class="title">Google Search Feed</h3>
          <div class="stats">
            <el-tooltip content="Today's API calls">
              <el-tag size="small" type="info">
                API: {{ todayApiCalls }}/100
              </el-tag>
            </el-tooltip>
            <el-tag 
              size="small" 
              :type="searchInfo.formattedTotalResults ? 'success' : 'info'"
            >
              {{ searchInfo.formattedTotalResults || 0 }} results
            </el-tag>
            <el-tag size="small" type="success">
              {{ searchInfo.formattedSearchTime || 0 }}s
            </el-tag>
          </div>
        </div>
        <div class="header-right">
          <el-radio-group 
            v-model="searchOptions.lr" 
            class="lang-select"
            @change="handleSearchOptionsChange"
            size="large"
          >
            <el-radio-button label="lang_en">EN</el-radio-button>
            <el-radio-button label="lang_zh-CN">中文</el-radio-button>
          </el-radio-group>
          
          <el-select 
            v-model="searchOptions.dateRestrict" 
            class="time-select"
            :placeholder="searchOptions.lr === 'lang_zh-CN' ? '时间范围' : 'Time Range'"
            @change="handleSearchOptionsChange"
          >
            <el-option 
              v-for="option in timeOptions" 
              :key="option.value"
              :label="searchOptions.lr === 'lang_zh-CN' ? option.labelZh : option.label"
              :value="option.value" 
            />
          </el-select>

          <el-select
            v-model="searchOptions.sort"
            class="sort-select"
            :placeholder="searchOptions.lr === 'lang_zh-CN' ? '排序方式' : 'Sort by'"
            @change="handleSearchOptionsChange"
          >
            <el-option
              v-for="option in sortOptions"
              :key="option.value"
              :label="searchOptions.lr === 'lang_zh-CN' ? option.labelZh : option.label"
              :value="option.value"
            />
          </el-select>

          <el-input
            v-model="searchQuery"
            :placeholder="searchOptions.lr === 'lang_zh-CN' ? '搜索关键词' : 'Search keyword'"
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            clearable
          >
            <template #append>
              <el-button 
                :loading="loading"
                @click="handleSearch"
                :disabled="!searchQuery.trim()"
              >
                <el-icon><Refresh /></el-icon>
                {{ searchOptions.lr === 'lang_zh-CN' ? '刷新' : 'Refresh' }}
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </template>

    <!-- Category tabs -->
    <el-tabs v-model="activeCategory" class="feed-tabs">
      <el-tab-pane label="All" name="all">
        <template #label>
          <el-tooltip
            :content="searchOptions.lr === 'lang_zh-CN' ? '显示所有搜索结果' : 'Show all search results'"
            placement="top"
          >
            <div class="tab-label">
              <span>{{ searchOptions.lr === 'lang_zh-CN' ? '全部' : 'All' }}</span>
              <el-tag size="small" type="info" class="tab-count">
                {{ searchItems.length }}
              </el-tag>
            </div>
          </el-tooltip>
        </template>
      </el-tab-pane>
      <el-tab-pane 
        v-for="category in categories" 
        :key="category.name"
        :name="category.name"
      >
        <template #label>
          <el-tooltip
            :content="getCategoryTooltip(category.name)"
            placement="top"
          >
            <div class="tab-label">
              <span>{{ 
                searchOptions.lr === 'lang_zh-CN' 
                  ? getCategoryLabel(category.name) 
                  : category.label 
              }}</span>
              <el-tag 
                size="small" 
                :type="category.type" 
                class="tab-count"
              >
                {{ getCategoryCount(category.name) }}
              </el-tag>
            </div>
          </el-tooltip>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- Search results -->
    <div class="search-content" v-loading="loading">
      <template v-if="searchItems.length">
        <div 
          v-for="(item, index) in searchItems" 
          :key="index"
          class="search-item"
        >
          <div class="item-container">
            <!-- 缩略图 -->
            <div 
              v-if="getItemImage(item)" 
              class="item-image"
            >
              <el-image
                :src="getItemImage(item)"
                fit="cover"
                loading="lazy"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>

            <!-- 内容 -->
            <div class="item-content">
              <!-- 标题和链接 -->
              <div class="item-header">
                <h4 class="item-title">
                  <a 
                    :href="item.link" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    v-html="highlightKeywords(item.htmlTitle || item.title)"
                  ></a>
                </h4>
                <span class="item-link">{{ item.displayLink }}</span>
              </div>

              <!-- 描述 -->
              <p 
                class="item-description" 
                v-html="highlightKeywords(item.htmlSnippet || item.snippet)"
              ></p>

              <!-- 元数据 -->
              <div class="item-meta">
                <div class="meta-left">
                  <span class="meta-item" v-if="item.pagemap?.metatags?.[0]?.['og:site_name']">
                    <el-icon><Collection /></el-icon>
                    {{ item.pagemap.metatags[0]['og:site_name'] }}
                  </span>
                </div>
                <div class="meta-right">
                  <el-button 
                    type="primary" 
                    link
                    @click="openLink(item.link)"
                  >
                    {{ searchOptions.lr === 'lang_zh-CN' ? '查看原文' : 'View Source' }}
                    <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="searchOptions.num"
            :total="Math.min(parseInt(searchInfo.totalResults) || 0, 100)"
            :disabled="loading"
            :background="true"
            layout="prev, pager, next, total"
            @current-change="handlePageChange"
          />
        </div>
      </template>

      <!-- 空状态 -->
      <el-empty 
        v-else-if="!loading"
        :description="searchOptions.lr === 'lang_zh-CN' ? '暂无搜索结果' : 'No results found'"
      />
    </div>
 
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Refresh, 
  ArrowRight, 
  Search,
  User,
  Collection,
  Picture 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { searchContent } from '../api/googleSearch'
import { useDebounceFn } from '@vueuse/core'
import { searchService } from '../firebase/searchService'
import { statsService } from '../firebase/statsService'
import { testFirebaseConnection } from '../firebase/testConnection'
import { performanceService } from '../firebase/performanceService'

dayjs.extend(relativeTime)

const loading = ref(false)
const searchItems = ref([])
const searchInfo = ref({})
const activeCategory = ref('all')
const searchQuery = ref('vertu')

const currentPage = ref(1)
const searchHistory = ref([])
const maxHistoryItems = 10

// Categories definition
const categories = [
  { name: 'official', label: 'Official', type: 'primary' },
  { name: 'review', label: 'Reviews', type: 'success' },
  { name: 'news', label: 'News', type: 'warning' },
  { name: 'discussion', label: 'Discussion', type: 'info' }
]

// Time options
const timeOptions = [
  { value: 'd1', label: 'Last 24 hours', labelZh: '最近24小时' },
  { value: 'w1', label: 'Last week', labelZh: '最近一周' },
  { value: 'm1', label: 'Last month', labelZh: '最近一月' },
  { value: 'y1', label: 'Last year', labelZh: '最近一年' },
  { value: '', label: 'All time', labelZh: '所有时间' }
]

// Sort options
const sortOptions = [
  { value: 'date', label: 'Most recent', labelZh: '最新发布' },
  { value: 'relevance', label: 'Most relevant', labelZh: '最相关' }
]

// Search options
const searchOptions = ref({
  dateRestrict: 'd1',
  lr: 'lang_en',
  num: 10,
  start: 1,
  sort: 'date'
})

const todayApiCalls = ref(0)
const searchStartTime = ref(0)
const searchMetrics = ref({})

// Content categorization logic
const categorizeContent = (item) => {
  const title = item.title?.toLowerCase() || ''
  const snippet = item.snippet?.toLowerCase() || ''
  const link = item.link?.toLowerCase() || ''
  const content = `${title} ${snippet}`
  
  // Official category
  if (
    link.includes('vertu.com') || 
    link.includes('official') ||
    content.includes('official vertu') ||
    content.includes('vertu official')
  ) {
    return 'official'
  }
  
  // Review category
  if (
    content.includes('review') ||
    content.includes('hands-on') ||
    content.includes('hands on') ||
    content.includes('testing') ||
    content.includes('评测') ||
    content.includes('测评')
  ) {
    return 'review'
  }
  
  // News category
  if (
    link.includes('news') ||
    link.includes('/news/') ||
    content.includes('announces') ||
    content.includes('launches') ||
    content.includes('released') ||
    content.includes('发布') ||
    content.includes('新闻') ||
    content.includes('资讯')
  ) {
    return 'news'
  }
  
  // Discussion category
  if (
    link.includes('forum') ||
    link.includes('discussion') ||
    link.includes('reddit.com') ||
    link.includes('community') ||
    content.includes('forum') ||
    content.includes('discussion') ||
    content.includes('论坛') ||
    content.includes('讨论')
  ) {
    return 'discussion'
  }
  
  // Default to news if no other category matches
  return 'news'
}

// Computed and methods
const filteredItems = computed(() => {
  if (activeCategory.value === 'all') {
    return searchItems.value
  }
  return searchItems.value.filter(item => item.category === activeCategory.value)
})

const getCategoryCount = (category) => {
  return searchItems.value.filter(item => item.category === category).length
}

const getCategoryType = (category) => {
  const categoryConfig = categories.find(c => c.name === category)
  return categoryConfig?.type || 'info'
}

// 保存搜索历史
const saveToHistory = (query) => {
  if (!query.trim()) return
  
  const history = new Set(searchHistory.value)
  history.delete(query) // 删除已存在的
  history.add(query) // 添加到最新
  
  searchHistory.value = Array.from(history).slice(-maxHistoryItems)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 监听搜索选项变化
watch(searchOptions, (newVal, oldVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
    handleSearch()
  }
}, { deep: true })

// 处理搜索选项变化
const handleSearchOptionsChange = () => {
  console.log('Search options changed:', searchOptions.value) // 调试日志
  currentPage.value = 1 // 重置页码
  handleSearch()
}

// 初始化加载
onMounted(async () => {
  try {
    // 首次加载时不强制刷新，只从缓存获取
    const results = await searchService.search(searchQuery.value, searchOptions.value, false)
    if (results) {
      searchItems.value = results.items || []
      searchInfo.value = results.searchInfo || {}
    }
  } catch (error) {
    console.error('Initial load error:', error)
  }
})

// 手动刷新搜索
const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  loading.value = true
  searchStartTime.value = performance.now()
  
  try {
    // 手动搜索时强制刷新
    const results = await searchService.search(searchQuery.value, searchOptions.value, true)
    searchInfo.value = results.searchInfo
    searchItems.value = results.items || []
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error(error.message || 'Search failed')
    searchItems.value = []
  } finally {
    loading.value = false
  }
}

// 防抖处理
const debouncedSearch = useDebounceFn(handleSearch, 300)

// 刷新搜索
const refreshSearch = () => {
  currentPage.value = 1
  handleSearch()
}

const handlePageChange = (page) => {
  currentPage.value = page
  handleSearch()
  // 平滑滚动到顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const formatDate = (date) => {
  if (!date) return ''
  const now = dayjs()
  const postDate = dayjs(date)
  
  if (now.diff(postDate, 'hour') < 24) {
    return postDate.fromNow() // 24小时内显示相对时间
  } else {
    return postDate.format('YYYY-MM-DD HH:mm')
  }
}

// 获取搜索结果的图片
const getItemImage = (item) => {
  const pagemap = item.pagemap || {}
  
  // 尝试获取不同类型的图片
  const image = 
    pagemap.cse_image?.[0]?.src ||
    pagemap.cse_thumbnail?.[0]?.src ||
    pagemap.metatags?.[0]?.['og:image'] ||
    pagemap.metatags?.[0]?.['twitter:image'] ||
    ''
    
  return image
}

// 加载历史记录
onMounted(() => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
  handleSearch()
})

// 获取界面文本
const getUIText = computed(() => ({
  noResults: searchOptions.value.lr === 'lang_zh-CN' ? '暂无搜索结果' : 'No results found',
  searching: searchOptions.value.lr === 'lang_zh-CN' ? '搜索中...' : 'Searching...',
  viewSource: searchOptions.value.lr === 'lang_zh-CN' ? '查看原文' : 'View Source',
  refresh: searchOptions.value.lr === 'lang_zh-CN' ? '刷新' : 'Refresh'
}))

// 分类提示信息
const getCategoryTooltip = (categoryName) => {
  const tooltips = {
    en: {
      official: 'Official content from Vertu website and authorized channels',
      review: 'Product reviews, hands-on experiences, and testing articles',
      news: 'Latest news, product launches, and industry updates',
      discussion: 'Community discussions, forum posts, and user feedback'
    },
    zh: {
      official: 'Vertu官方网站和授权渠道发布的内容',
      review: '产品评测、上手体验和测试文章',
      news: '最新新闻、产品发布和行业动态',
      discussion: '社区讨论、论坛帖子和用户反馈'
    }
  }

  const language = searchOptions.value.lr === 'lang_zh-CN' ? 'zh' : 'en'
  return tooltips[language][categoryName] || ''
}

// 分类标签中文
const getCategoryLabel = (categoryName) => {
  const categoryLabels = {
    official: '官方',
    review: '评测',
    news: '新闻',
    discussion: '讨论'
  }
  return categoryLabels[categoryName] || categoryName
}

// 高亮关键词
const highlightKeywords = (text) => {
  if (!text || !searchQuery.value) return text
  
  // Google API 已经返回了带 HTML 标签的高亮文本
  // 如果是 htmlTitle 或 htmlSnippet，直接返回
  if (text.includes('<b>')) return text
  
  // 否则进行自定义高亮
  const keywords = searchQuery.value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(keyword => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (!keywords.length) return text

  const regex = new RegExp(`(${keywords.join('|')})`, 'gi')
  return text.replace(regex, '<b>$1</b>')
}

// 安全打开链接
const openLink = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 获取今日 API 调用次数
const updateApiStats = async () => {
  todayApiCalls.value = await statsService.getTodayCallCount()
}

// 监听搜索完成
watch(loading, async (newVal, oldVal) => {
  if (oldVal && !newVal) {
    await updateApiStats()
  }
})

// 初始化
onMounted(async () => {
  try {
    const isConnected = await testFirebaseConnection()
    if (isConnected) {
      ElMessage.success('Firebase 数据库连接成功!')
      await updateApiStats()
      await handleSearch() // 执行初始搜索
    } else {
      ElMessage.error('Firebase 数据库连接失败!')
    }
  } catch (error) {
    console.error('Firebase test error:', error)
    ElMessage.error(error.message || 'Firebase 数据库连接失败!')
  }
})

// 显示性能指标
const formatMetric = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return value
}
</script>

<style scoped>
.alerts-feed {
  height: 100%;
  background-color: var(--el-bg-color);
  border-color: var(--el-border-color-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.feed-tabs {
  margin: 20px 0;
}

.tab-count {
  margin-left: 8px;
}

.search-item {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;
}

.search-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.item-container {
  display: flex;
  gap: 20px;
}

.item-image {
  flex-shrink: 0;
  width: 200px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--el-fill-color-lighter);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 24px;
}

.image-placeholder.loading {
  animation: pulse 1.5s infinite;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.item-title {
  margin: 0 0 8px;
  font-size: 18px;
  line-height: 1.4;
}

.item-title a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.item-title a:hover {
  text-decoration: underline;
}

.item-link {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.item-description {
  margin: 8px 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.item-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-select,
.time-select,
.sort-select {
  width: 160px;
}

.search-input {
  width: 300px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.meta-left {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrapper {
  margin: 24px 0;
  padding: 16px 0;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--el-border-color-lighter);
}

:deep(.el-pagination) {
  --el-pagination-font-size: 14px;
  --el-pagination-bg-color: var(--el-bg-color);
  --el-pagination-text-color: var(--el-text-color-primary);
  --el-pagination-button-color: var(--el-text-color-primary);
  --el-pagination-button-bg-color: var(--el-bg-color);
  --el-pagination-button-disabled-color: var(--el-text-color-placeholder);
  --el-pagination-button-disabled-bg-color: var(--el-bg-color);
  --el-pagination-hover-color: var(--el-color-primary);
}

:deep(.el-pagination.is-background) {
  .btn-prev,
  .btn-next,
  .el-pager li {
    background-color: var(--el-bg-color-overlay);
    color: var(--el-text-color-primary);
    border: 1px solid var(--el-border-color);
    
    &:hover {
      color: var(--el-color-primary);
    }
    
    &.is-active {
      background-color: var(--el-color-primary);
      color: var(--el-color-white);
      border-color: var(--el-color-primary);
      
      &:hover {
        color: var(--el-color-white);
      }
    }
    
    &.is-disabled {
      background-color: var(--el-disabled-bg-color);
      color: var(--el-text-color-placeholder);
      border-color: var(--el-border-color-lighter);
    }
  }
}

/* 暗黑模式适配 */
:deep(.dark) {
  .el-pagination.is-background {
    .btn-prev,
    .btn-next,
    .el-pager li {
      background-color: var(--el-bg-color);
      border-color: var(--el-border-color-darker);
      
      &:not(.is-active):hover {
        color: var(--el-color-primary);
      }
      
      &.is-active {
        background-color: var(--el-color-primary);
        color: var(--el-color-white);
        border-color: var(--el-color-primary);
      }
    }
  }
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .item-container {
    flex-direction: column;
  }

  .item-image {
    width: 100%;
    height: 200px;
  }

  .item-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-right {
    flex-direction: column;
    gap: 8px;
  }

  .lang-select,
  .time-select,
  .sort-select,
  .search-input {
    width: 100%;
  }

  .lang-select {
    display: flex;
    justify-content: center;
  }

  .pagination-wrapper {
    margin: 16px 0;
    padding: 12px 0;
  }

  .item-title {
    font-size: 16px;
  }
  
  .item-description {
    font-size: 13px;
  }
}

/* 暗黑模式适配 */
:deep(.dark) {
  .el-card {
    background-color: var(--el-bg-color);
    border-color: var(--el-border-color-light);
  }

  .search-item:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  }

  .item-title a {
    color: var(--el-text-color-primary);
    
    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }

  .item-description {
    color: var(--el-text-color-regular);
  }

  .item-date {
    color: var(--el-text-color-secondary);
  }

  .search-input {
    .el-input__inner {
      background-color: var(--el-bg-color);
      border-color: var(--el-border-color-light);
      color: var(--el-text-color-primary);
    }
  }

  .el-pagination {
    --el-pagination-button-bg-color: var(--el-bg-color-overlay);
    --el-pagination-hover-color: var(--el-color-primary);
  }
  
  .meta-item {
    color: var(--el-text-color-secondary);
  }

  .image-placeholder {
    background-color: var(--el-fill-color-darker);
    color: var(--el-text-color-secondary);
  }
}

.empty-content {
  text-align: center;
  color: var(--el-text-color-secondary);
}

.suggestions {
  margin: 16px 0 8px;
  font-weight: bold;
}

.empty-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 14px;
}

.empty-content li {
  margin: 4px 0;
}

/* 加载动画 */
.search-content {
  min-height: 200px;
}

/* 修复链接样式 */
.source-link {
  text-decoration: none;
}

.source-link:hover {
  text-decoration: none;
}

.search-stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* 语言切换按钮样式 */
:deep(.el-radio-button__inner) {
  padding: 8px 16px;
}

/* Tab styles */
.feed-tabs {
  margin: 16px 0;
}

.tab-count {
  margin-left: 8px;
  font-size: 12px;
}

:deep(.el-tabs__nav) {
  border-radius: 4px;
}

:deep(.el-tabs__item) {
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
}

:deep(.el-tabs__item.is-active) {
  font-weight: 600;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

/* Tooltip 样式优化 */
:deep(.el-tooltip__trigger) {
  display: inline-flex;
  align-items: center;
}

:deep(.el-tooltip__popper) {
  max-width: 300px;
  line-height: 1.5;
}

/* 暗黑模式适配 */
:deep(.dark) {
  .el-tooltip__popper {
    --el-tooltip-bg-color: var(--el-bg-color-overlay);
    --el-tooltip-border-color: var(--el-border-color-darker);
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

/* 高亮样式 */
:deep(.highlight) {
  background-color: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

/* 暗黑模式适配 */
:deep(.dark) {
  .highlight {
    background-color: var(--el-color-warning-dark-2);
    color: var(--el-color-warning-light-9);
  }
}

:deep(b) {
  color: var(--el-color-black);
  background-color: var(--el-color-warning-light-9);
  font-weight: normal;
  padding: 0 2px;
  border-radius: 2px;
}

/* 暗黑模式适配 */
:deep(.dark) {
  b {
    color: var(--el-color-white);
    background-color: var(--el-color-warning-dark-2);
  }
}

.stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.performance-metrics {
  margin: 16px 0;
  padding: 16px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
}

:deep(.el-descriptions) {
  margin-bottom: 0;
}

:deep(.el-descriptions__title) {
  font-size: 14px;
  margin-bottom: 12px;
}

/* Select 组件样式 */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-select {
  width: 200px;
}

.sort-select {
  width: 180px;
}

:deep(.el-select__wrapper) {
  display: flex !important;  /* 使用 flex 布局 */
}

.search-input {
  width: 300px;
}

/* 暗黑模式适配 */
:deep(.dark) {
  .el-select {
    .el-input__wrapper {
      background-color: var(--el-bg-color);
    }
  }
}
</style> 