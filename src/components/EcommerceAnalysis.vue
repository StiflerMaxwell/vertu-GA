<template>
  <div class="ecommerce-analysis" v-loading="loading">
    <div class="analysis-header">
      <div class="title-section">
        <h3 class="analysis-title">电子商务分析</h3>
        <el-tag size="small" type="success">电商</el-tag>
      </div>
      
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索产品名称/来源/媒介"
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="product-table">
      <el-table 
        :data="productData" 
        style="width: 100%"
        @sort-change="handleSortChange"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column 
          prop="itemName" 
          label="产品名称" 
          min-width="220"
          sortable="custom"
        >
          <template #header>
            <el-tooltip
              content="显示在网站中展示的商品名称"
              placement="top"
              :effect="isDark ? 'dark' : 'light'"
              popper-class="custom-tooltip"
            >
              <span>产品名称</span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div class="product-info">
              <el-icon :size="20">
                <ShoppingCart />
              </el-icon>
              <el-tooltip
                :content="row.itemName"
                placement="top"
                :effect="isDark ? 'dark' : 'light'"
                popper-class="custom-tooltip"
                :show-after="500"
                max-width="300"
              >
                <span class="table-cell-text product-name">{{ row.itemName }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column 
          prop="source" 
          label="流量来源" 
          min-width="300"
          sortable="custom"
        >
          <template #header>
            <el-tooltip
              content="用户首次访问网站的来源，包括来源/媒介/广告系列"
              placement="top"
              :effect="isDark ? 'dark' : 'light'"
              popper-class="custom-tooltip"
            >
              <span>流量来源</span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div class="source-medium-info">
              <span class="source-name">{{ row.source }}</span>
              <span class="separator">/</span>
              <span class="medium-name">{{ row.medium }}</span>
              <span class="separator">/</span>
              <span class="campaign-name">{{ row.campaign || '(未设置)' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="itemViews" 
          label="商品浏览量" 
          min-width="100"
          sortable="custom"
        >
          <template #header>
            <el-tooltip
              content="商品详情页的浏览次数，反映商品的受欢迎程度"
              placement="top"
              :effect="isDark ? 'dark' : 'light'"
              popper-class="custom-tooltip"
            >
              <span>商品浏览量</span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <span class="table-cell-text">{{ formatNumber(row.itemViews) }}</span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="addToCarts" 
          label="加购数" 
          min-width="100"
          sortable="custom"
        >
          <template #header>
            <el-tooltip
              content="将商品添加到购物车的次数，反映商品的购买意向"
              placement="top"
              :effect="isDark ? 'dark' : 'light'"
              popper-class="custom-tooltip"
            >
              <span>加购数</span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <span class="table-cell-text">{{ formatNumber(row.addToCarts) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="checkouts" 
          label="发结数" 
          min-width="100"
          sortable="custom"
        >
          <template #header>
            <el-tooltip
              content="开始结账的次数，反映实际购买行为"
              placement="top"
              :effect="isDark ? 'dark' : 'light'"
              popper-class="custom-tooltip"
            >
              <span>发结数</span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <span class="table-cell-text">{{ formatNumber(row.checkouts) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="itemRevenue" 
          label="转化价值" 
          min-width="120"
          sortable="custom"
        >
          <template #header>
            <el-tooltip
              content="商品的总价值，包含所有交易收入"
              placement="top"
              :effect="isDark ? 'dark' : 'light'"
              popper-class="custom-tooltip"
            >
              <span>转化价值</span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <span class="table-cell-text money">{{ formatCurrency(row.itemRevenue) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="conversionRate" 
          label="转化率" 
          min-width="100"
          sortable="custom"
        >
          <template #header>
            <el-tooltip
              content="购买用户数/总访问用户数，反映商品的转化效果"
              placement="top"
              :effect="isDark ? 'dark' : 'light'"
              popper-class="custom-tooltip"
            >
              <span>转化率</span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <span 
              class="table-cell-text"
              :class="{
                'conversion-rate-good': row.conversionRate > 0.05,
                'conversion-rate-medium': row.conversionRate > 0.01 && row.conversionRate <= 0.05,
                'conversion-rate-poor': row.conversionRate <= 0.01
              }"
            >
              {{ formatPercent(row.conversionRate) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 添加图表区域 -->
    <div class="charts-area">
      <div class="views-chart">
        <div class="chart-title">浏览量最高的产品</div>
        <div class="chart-container" ref="viewsChartRef"></div>
      </div>
      
      <div class="add-to-cart-chart">
        <div class="chart-title">加购率最高的产品</div>
        <div class="chart-container" ref="addToCartChartRef"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, watchEffect, nextTick, onUnmounted, computed } from 'vue'
import { ga4Client } from '../api/ga4'
import { Search, ShoppingCart, Money, PriceTag, View, Link, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useDebounceFn } from '@vueuse/core'
import * as echarts from 'echarts'

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  }
})

// 基础状态
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const productData = ref([])
const currentSort = ref({
  prop: 'itemViews',
  order: 'descending'
})

// 图表引用
const viewsChartRef = ref(null)
const addToCartChartRef = ref(null)
let viewsChart = null
let addToCartChart = null

// 总计数据
const totals = ref({
  itemViews: 0,
  itemsViewed: 0,
  addToCarts: 0,
  checkouts: 0,
  transactions: 0
})

// 获取主题状态
const isDark = computed(() => document.documentElement.classList.contains('dark'))

// 防抖搜索
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1  // 重置页码
  fetchData()
}, 300)

// 处理搜索
const handleSearch = () => {
  debouncedSearch()
}

// 页码和条数变化处理
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchData()
}

// 排序处理
const handleSortChange = ({ prop, order }) => {
  if (prop) {
    currentSort.value = { prop, order }
    fetchData()
  }
}

// 辅助函数
const isValidDate = (dateString) => {
  if (!dateString) return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// 格式化函数
const formatNumber = (num) => {
  if (num === undefined || num === null) return '-'
  return new Intl.NumberFormat('zh-CN').format(Math.round(num))
}

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('zh-CN', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatPercent = (value) => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('zh-CN', { 
    style: 'percent', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// 表格汇总方法
const getSummaries = (param) => {
  const { columns } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '总计'
      return
    }
    
    if (!totals.value) {
      sums[index] = ''
      return
    }
    
    switch (column.property) {
      case 'itemViews':
        sums[index] = formatNumber(totals.value.itemViews || 0)
        break
      case 'addToCarts':
        sums[index] = formatNumber(totals.value.addToCarts || 0)
        break
      case 'checkouts':
        sums[index] = formatNumber(totals.value.checkouts || 0)
        break
      case 'itemRevenue':
        sums[index] = formatCurrency(totals.value.itemRevenue || 0)
        break
      case 'conversionRate':
        if (totals.value.itemViews && totals.value.itemsPurchased) {
          sums[index] = formatPercent(totals.value.itemsPurchased / totals.value.itemViews)
        } else {
          sums[index] = '-'
        }
        break
      default:
        sums[index] = ''
    }
  })
  
  return sums
}

// 获取数据的主函数
async function fetchData() {
  if (!isValidDate(props.startDate) || !isValidDate(props.endDate)) {
    console.log('等待有效日期...')
    return
  }

  loading.value = true
  
  try {
    console.log('获取电子商务数据:', props.startDate, 'to', props.endDate)
    
    // 基础请求配置 - 使用更复杂的查询获取更准确的电子商务数据
    const baseRequest = {
      dateRanges: [{
        startDate: props.startDate,
        endDate: props.endDate
      }],
      dimensions: [
        { name: 'itemName' },                // 产品名称
        { name: 'firstUserSource' },         // 首次来源
        { name: 'firstUserMedium' },         // 首次媒介
        { name: 'firstUserCampaignName' }    // 首次广告系列名称
      ],
      metrics: [
        { name: 'itemsViewed' },             // 查看过的商品数
        { name: 'itemsAddedToCart' },        // 加入购物车的商品数
        { name: 'itemsCheckedOut' },         // 结账的商品数
        { name: 'itemsPurchased' },          // 已购买的商品数
        { name: 'itemRevenue' }              // 商品收入
      ]
    }

    // 添加搜索过滤条件
    if (searchKeyword.value) {
      baseRequest.dimensionFilter = {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'itemName',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: searchKeyword.value,
                  caseSensitive: false
                }
              }
            },
            {
              filter: {
                fieldName: 'firstUserSource',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: searchKeyword.value,
                  caseSensitive: false
                }
              }
            },
            {
              filter: {
                fieldName: 'firstUserMedium',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: searchKeyword.value,
                  caseSensitive: false
                }
              }
            }
          ]
        }
      }
    }

    // 获取总计数据的请求
    const totalsRequest = {
      dateRanges: [{
        startDate: props.startDate,
        endDate: props.endDate
      }],
      metrics: [
        { name: 'itemsViewed' },
        { name: 'itemsAddedToCart' },
        { name: 'itemsCheckedOut' },
        { name: 'itemsPurchased' },
        { name: 'itemRevenue' }
      ]
    }
    
    // 如果有搜索关键词，将相同的过滤条件应用到总计请求
    if (searchKeyword.value) {
      totalsRequest.dimensionFilter = baseRequest.dimensionFilter
    }

    // 排序配置
    const getOrderByField = (prop) => {
      switch (prop) {
        case 'itemViews':
          return { metric: { metricName: 'itemsViewed' } }
        case 'addToCarts':
          return { metric: { metricName: 'itemsAddedToCart' } }
        case 'checkouts':
          return { metric: { metricName: 'itemsCheckedOut' } }
        case 'itemRevenue':
          return { metric: { metricName: 'itemRevenue' } }
        case 'itemName':
          return { dimension: { dimensionName: 'itemName' } }
        case 'source':
          return { dimension: { dimensionName: 'firstUserSource' } }
        case 'medium':
          return { dimension: { dimensionName: 'firstUserMedium' } }
        case 'campaign':
          return { dimension: { dimensionName: 'firstUserCampaignName' } }
        case 'conversionRate':
          // 转化率无法直接排序，使用替代的排序字段
          return { metric: { metricName: 'itemsCheckedOut' } }
        default:
          return { metric: { metricName: 'itemsViewed' } }
      }
    }

    // 分页和排序请求
    const pageRequest = {
      ...baseRequest,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
      orderBys: [{
        ...getOrderByField(currentSort.value.prop),
        desc: currentSort.value.order === 'descending'
      }]
    }

    // 获取分页数据和总计数据
    const [pageResponse, totalsResponse] = await Promise.all([
      ga4Client.runReport(pageRequest),
      ga4Client.runReport(totalsRequest)
    ])

    console.log('电子商务数据响应:', pageResponse)
    console.log('电子商务总计数据:', totalsResponse)

    // 处理总计数据
    if (totalsResponse?.rows?.length) {
      // 计算所有数据的总计
      totals.value = {
        itemViews: totalsResponse.rows.reduce((sum, row) => sum + (parseInt(row.metricValues[0].value) || 0), 0),
        addToCarts: totalsResponse.rows.reduce((sum, row) => sum + (parseInt(row.metricValues[1].value) || 0), 0),
        checkouts: totalsResponse.rows.reduce((sum, row) => sum + (parseInt(row.metricValues[2].value) || 0), 0),
        itemsPurchased: totalsResponse.rows.reduce((sum, row) => sum + (parseInt(row.metricValues[3].value) || 0), 0),
        itemRevenue: totalsResponse.rows.reduce((sum, row) => sum + (parseFloat(row.metricValues[4].value) || 0), 0)
      }

      // 计算总体转化率
      totals.value.conversionRate = totals.value.itemViews > 0 
        ? totals.value.itemsPurchased / totals.value.itemViews 
        : 0
    }

    // 处理分页数据
    if (pageResponse?.rows?.length) {
      productData.value = pageResponse.rows.map(row => {
        const itemViews = parseInt(row.metricValues[0].value) || 0
        const itemRevenue = parseFloat(row.metricValues[4].value) || 0
        const itemsPurchased = parseInt(row.metricValues[3].value) || 0
        
        // 计算转化率：转化次数 / 广告互动总次数
        const conversionRate = itemViews > 0 ? itemsPurchased / itemViews : 0
        
        // 准备产品数据
        return {
          itemName: row.dimensionValues[0].value || '(未命名产品)',
          source: row.dimensionValues[1].value || '(direct)',
          medium: row.dimensionValues[2].value || '(none)',
          campaign: row.dimensionValues[3].value || '(未设置)',
          itemViews,
          addToCarts: parseInt(row.metricValues[1].value) || 0,
          checkouts: parseInt(row.metricValues[2].value) || 0,
          itemsPurchased,
          itemRevenue,
          conversionRate
        }
      })
      
      // 如果选择了按转化率排序，手动排序
      if (currentSort.value.prop === 'conversionRate') {
        productData.value.sort((a, b) => {
          const diff = currentSort.value.order === 'descending' 
            ? b.conversionRate - a.conversionRate
            : a.conversionRate - b.conversionRate
          return diff
        })
      }
    } else {
      productData.value = []
    }

    // 更新总数
    total.value = pageResponse.rowCount || 0
    
    // 数据加载完成后更新图表
    nextTick(() => {
      updateCharts()
    })
    
  } catch (error) {
    console.error('获取电子商务数据失败:', error)
    ElMessage.error('获取电子商务数据失败')
    productData.value = []
  } finally {
    loading.value = false
  }
}

// 监听搜索关键词变化
watch(searchKeyword, () => {
  handleSearch()
})

// 初始加载数据
onMounted(() => {
  if (isValidDate(props.startDate) && isValidDate(props.endDate)) {
    fetchData()
  }
  
  // 初始化图表
  nextTick(() => {
    initCharts()
  })
})

// 初始化图表
const initCharts = () => {
  // 浏览量图表
  if (viewsChartRef.value) {
    viewsChart = echarts.init(viewsChartRef.value)
    
    // 设置监听器
    window.addEventListener('resize', () => {
      if (viewsChart) viewsChart.resize()
    })
    
    // 添加折叠/展开事件监听
    document.addEventListener('collapseChange', () => {
      setTimeout(() => {
        if (viewsChart) viewsChart.resize()
      }, 400)
    })
  }
  
  // 加购率图表
  if (addToCartChartRef.value) {
    addToCartChart = echarts.init(addToCartChartRef.value)
    
    // 设置监听器
    window.addEventListener('resize', () => {
      if (addToCartChart) addToCartChart.resize()
    })
    
    // 添加折叠/展开事件监听
    document.addEventListener('collapseChange', () => {
      setTimeout(() => {
        if (addToCartChart) addToCartChart.resize()
      }, 400)
    })
  }
  
  // 更新图表
  updateCharts()
}

// 更新图表
const updateCharts = () => {
  if (!productData.value.length) return
  
  // 浏览量图表数据准备
  const topViewsProducts = [...productData.value]
    .sort((a, b) => b.itemViews - a.itemViews)
    .slice(0, 5)
  
  // 加购率图表数据准备 (过滤浏览量大于阈值的产品，避免偶然性)
  const minViewThreshold = 10 // 最小浏览量阈值
  const topAddToCartProducts = [...productData.value]
    .filter(product => product.itemViews >= minViewThreshold)
    .map(product => ({
      ...product,
      addToCartRate: product.itemViews > 0 ? product.addToCarts / product.itemViews : 0
    }))
    .sort((a, b) => b.addToCartRate - a.addToCartRate)
    .slice(0, 5)
  
  // 更新浏览量图表
  if (viewsChart) {
    const viewsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const product = params[0]
          const dataIndex = product.dataIndex
          const item = topViewsProducts[dataIndex]
          return `<div>
            <div>${product.name}</div>
            <div>浏览量: ${formatNumber(product.value)}</div>
            <div>加购数: ${formatNumber(item.addToCarts)}</div>
            <div>加购率: ${formatPercent(item.addToCarts / item.itemViews)}</div>
          </div>`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value) => formatNumber(value)
        }
      },
      yAxis: {
        type: 'category',
        data: topViewsProducts.map(p => p.itemName),
        axisLabel: {
          width: 120,
          overflow: 'truncate'
        }
      },
      series: [
        {
          name: '商品浏览量',
          type: 'bar',
          data: topViewsProducts.map(p => p.itemViews),
          itemStyle: {
            color: function(params) {
              // 渐变色区间
              const colorList = [
                '#91cc75', '#5470c6', '#fac858', '#ee6666', '#73c0de'
              ]
              return colorList[params.dataIndex % colorList.length]
            }
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params) => formatNumber(params.value)
          }
        }
      ]
    }
    
    viewsChart.setOption(viewsOption)
  }
  
  // 更新加购率图表
  if (addToCartChart) {
    const addToCartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const product = params[0]
          const dataIndex = product.dataIndex
          const item = topAddToCartProducts[dataIndex]
          return `<div>
            <div>${product.name}</div>
            <div>加购率: ${formatPercent(product.value)}</div>
            <div>浏览量: ${formatNumber(item.itemViews)}</div>
            <div>加购数: ${formatNumber(item.addToCarts)}</div>
          </div>`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value) => formatPercent(value)
        },
        max: function(value) {
          return Math.min(value.max * 1.2, 1) // 最大不超过100%
        }
      },
      yAxis: {
        type: 'category',
        data: topAddToCartProducts.map(p => p.itemName),
        axisLabel: {
          width: 120,
          overflow: 'truncate'
        }
      },
      series: [
        {
          name: '加购率',
          type: 'bar',
          data: topAddToCartProducts.map(p => p.addToCartRate),
          itemStyle: {
            color: function(params) {
              // 加购率对应颜色
              const value = topAddToCartProducts[params.dataIndex].addToCartRate
              if (value > 0.1) return '#67c23a' // 高加购率
              if (value > 0.05) return '#e6a23c' // 中等加购率
              return '#f56c6c' // 低加购率
            }
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params) => formatPercent(params.value)
          }
        }
      ]
    }
    
    addToCartChart.setOption(addToCartOption)
  }
}

// 清理图表
const disposeCharts = () => {
  if (viewsChart) {
    viewsChart.dispose()
    viewsChart = null
  }
  
  if (addToCartChart) {
    addToCartChart.dispose()
    addToCartChart = null
  }
}

// 在fetchData成功后更新图表
watch(productData, () => {
  nextTick(() => {
    updateCharts()
  })
}, { deep: true })

// 清理资源
onUnmounted(() => {
  disposeCharts()
  document.removeEventListener('collapseChange', updateCharts)
  window.removeEventListener('resize', updateCharts)
})

// 监听日期变化，重新获取数据
watch([() => props.startDate, () => props.endDate], () => {
  if (isValidDate(props.startDate) && isValidDate(props.endDate)) {
    currentPage.value = 1
    fetchData()
  }
})
</script>

<style scoped>
.ecommerce-analysis {
  width: 100%;
  height: 100%;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.product-table {
  position: relative;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

/* 重用TrafficSourceAnalysis的样式 */
:deep(.el-pagination) {
  --el-pagination-bg-color: var(--card-bg);
  --el-pagination-hover-color: var(--primary-color);
  --el-pagination-button-bg-color: var(--card-bg);
  --el-pagination-button-color: var(--text-color);
  --el-pagination-button-disabled-color: var(--text-secondary);
}

:deep(.el-pagination .el-select .el-input) {
  width: 110px;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

.table-cell-text {
  color: var(--text-color);
  font-weight: normal;
}

.table-cell-text.money {
  color: var(--success-color);
  font-weight: 500;
}

.table-cell-text.warning-text {
  color: var(--warning-color);
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-info .el-icon {
  padding: 6px;
  border-radius: 8px;
  background: var(--hover-bg);
  color: var(--el-color-primary);
}

.source-medium-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.source-name {
  font-weight: 500;
  color: var(--text-color);
}

.medium-name {
  color: var(--text-secondary);
}

.campaign-name {
  color: var(--text-secondary);
}

.separator {
  color: var(--text-secondary);
  opacity: 0.5;
}

.conversion-rate-good {
  color: var(--el-color-success);
}

.conversion-rate-medium {
  color: var(--el-color-warning);
}

.conversion-rate-poor {
  color: var(--el-color-danger);
}

/* 图表区域 */
.charts-area {
  margin-top: 40px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 1200px) {
  .charts-area {
    grid-template-columns: 1fr;
  }
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: var(--text-color);
}

.chart-container {
  height: 320px;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
}

/* 全局样式，不使用 scoped */
.custom-tooltip {
  background: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color-light) !important;
  color: var(--el-text-color-primary) !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
}

.custom-tooltip .el-tooltip__popper {
  background: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color-light) !important;
  color: var(--el-text-color-primary) !important;
}

.custom-tooltip .el-tooltip__arrow::before {
  background: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color-light) !important;
}

:deep(.el-table) {
  width: 100% !important;
  height: 100%;
  --el-table-border-color: var(--el-border-color-light);
  --el-table-header-bg-color: var(--el-bg-color);
  --el-table-row-hover-bg-color: var(--hover-bg);
  --el-table-header-text-color: var(--el-text-color-secondary);
  --el-table-text-color: var(--el-text-color-primary);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: var(--el-bg-color);
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

:deep(.el-table td) {
  background-color: var(--el-bg-color);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: var(--hover-bg) !important;
}

:deep(.el-table .cell) {
  white-space: nowrap;
}

/* 暗黑模式适配 */
:deep(.dark) {
  .el-table {
    background-color: var(--el-bg-color);
    color: #fff;
  }

  .el-table th,
  .el-table td {
    background-color: var(--el-bg-color);
    border-bottom-color: var(--el-border-color-light);
    color: #fff;
  }

  .el-table--striped .el-table__body tr.el-table__row--striped td {
    background: var(--el-bg-color-overlay);
    color: #fff;
  }

  .el-table--enable-row-hover .el-table__body tr:hover > td {
    background-color: var(--hover-bg) !important;
    color: #fff !important;
  }

  .el-table__body tr:hover > td {
    background-color: var(--hover-bg) !important;
    color: #fff !important;
  }
}

.product-name {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .ecommerce-analysis {
    padding: 14px;
  }
  
  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 14px;
  }
  
  .analysis-title {
    font-size: 15px;
  }
  
  .search-section {
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .date-selector,
  .platform-selector,
  .filter-input {
    width: 100%;
  }
  
  .metrics-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .comparison-value {
    font-size: 11px;
  }
  
  .chart-container {
    height: 240px;
    padding: 14px;
  }
  
  .chart-title {
    font-size: 14px;
    margin-bottom: 12px;
  }
  
  .product-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .pagination-container {
    justify-content: center;
    margin-top: 12px;
  }
  
  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-table .cell) {
    padding: 5px 6px;
  }
  
  .product-name {
    max-width: 200px;
  }
  
  .source-medium-info {
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
  }
  
  .separator {
    display: none;
  }
}

/* 小屏幕设备优化 */
@media screen and (max-width: 480px) {
  .ecommerce-analysis {
    padding: 10px;
  }
  
  .analysis-title {
    font-size: 14px;
  }
  
  .metric-card {
    padding: 10px;
  }
  
  .metric-value {
    font-size: 16px;
  }
  
  .metric-label {
    font-size: 11px;
  }
  
  .comparison-value {
    font-size: 10px;
  }
  
  .chart-container {
    height: 180px;
    padding: 10px;
  }
  
  .chart-title {
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .action-buttons .el-button {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .table-title {
    font-size: 13px;
  }
  
  .product-info {
    gap: 6px;
  }
  
  .product-name {
    max-width: 150px;
  }
  
  :deep(.el-pagination .el-select .el-input) {
    width: 85px;
  }
  
  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next) {
    min-width: 26px;
  }
  
  :deep(.el-pagination .el-pager li) {
    min-width: 26px;
    font-size: 11px;
  }
}
</style> 