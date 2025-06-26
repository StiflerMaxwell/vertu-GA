<template>
  <div class="clarity-analysis">
    <!-- 顶部控制区域 -->
    <div class="clarity-header">
      <div class="header-left">
        <el-radio-group v-model="selectedDays" @change="handleDaysChange" size="small">
          <el-radio-button :label="1">最近24小时</el-radio-button>
          <el-radio-button :label="2">最近48小时</el-radio-button>
          <el-radio-button :label="3">最近72小时</el-radio-button>
        </el-radio-group>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          size="small" 
          :loading="loading"
          @click="refreshData"
        >
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="metrics-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><User /></el-icon>
              </div>
                             <div class="metric-data">
                 <div class="metric-value">{{ totalUsers || 0 }}</div>
                 <div class="metric-label">总用户数</div>
               </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><View /></el-icon>
              </div>
                             <div class="metric-data">
                 <div class="metric-value">{{ totalSessions || 0 }}</div>
                 <div class="metric-label">总会话数</div>
               </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Robot /></el-icon>
              </div>
                             <div class="metric-data">
                 <div class="metric-value">{{ totalBotSessions || 0 }}</div>
                 <div class="metric-label">机器人会话</div>
               </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="metric-data">
                <div class="metric-value">{{ avgPagesPerSession }}</div>
                <div class="metric-label">平均页面/会话</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据分析区域 -->
    <div class="analysis-content">
      <el-row :gutter="20">
        <!-- 操作系统分布 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="title">操作系统分布</span>
                <el-button 
                  type="text" 
                  size="small" 
                  :loading="loadingOS"
                  @click="loadOSData"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <div ref="osChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 浏览器分布 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="title">浏览器分布</span>
                <el-button 
                  type="text" 
                  size="small" 
                  :loading="loadingBrowser"
                  @click="loadBrowserData"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <div ref="browserChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 设备类型分布 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="title">设备类型分布</span>
                <el-button 
                  type="text" 
                  size="small" 
                  :loading="loadingDevice"
                  @click="loadDeviceData"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <div ref="deviceChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 国家地区分布 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="title">国家/地区分布</span>
                <el-button 
                  type="text" 
                  size="small" 
                  :loading="loadingCountry"
                  @click="loadCountryData"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <div ref="countryChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 流量来源和页面分析 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 流量来源 -->
        <el-col :span="12">
          <el-card class="table-card">
            <template #header>
              <div class="card-header">
                <span class="title">流量来源</span>
                <el-button 
                  type="text" 
                  size="small" 
                  :loading="loadingSource"
                  @click="loadSourceData"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <el-table :data="sourceData" style="width: 100%" max-height="300">
              <el-table-column prop="source" label="来源" min-width="120" />
              <el-table-column prop="totalSessions" label="会话数" width="80" align="right" />
              <el-table-column prop="distinctUsers" label="用户数" width="80" align="right" />
              <el-table-column prop="pagesPerSession" label="页面/会话" width="100" align="right">
                <template #default="{ row }">
                  {{ row.pagesPerSession.toFixed(2) }}
                </template>
              </el-table-column>
            </el-table>
            <div v-if="!sourceData || sourceData.length === 0" class="no-data">
              暂无数据
            </div>
          </el-card>
        </el-col>

        <!-- 热门页面 -->
        <el-col :span="12">
          <el-card class="table-card">
            <template #header>
              <div class="card-header">
                <span class="title">热门页面</span>
                <el-button 
                  type="text" 
                  size="small" 
                  :loading="loadingURL"
                  @click="loadURLData"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <el-table :data="urlData" style="width: 100%" max-height="300">
              <el-table-column prop="url" label="页面URL" min-width="200">
                <template #default="{ row }">
                  <span class="url-text" :title="row.url">{{ formatURL(row.url) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="totalSessions" label="会话数" width="80" align="right" />
              <el-table-column prop="distinctUsers" label="用户数" width="80" align="right" />
            </el-table>
            <div v-if="!urlData || urlData.length === 0" class="no-data">
              暂无数据
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- API限制提示 -->
    <div class="api-notice">
      <el-alert
        title="API使用提醒"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          Microsoft Clarity API 每日限制10次请求，数据仅包含最近1-3天的内容。当前时间为UTC时区。
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  fetchClarityTrafficByOS,
  fetchClarityTrafficByBrowser,
  fetchClarityTrafficByDevice,
  fetchClarityTrafficByCountry,
  fetchClarityTrafficBySource,
  fetchClarityTrafficByURL
} from '@/api/clarity'
import {
  Refresh,
  User,
  View,
  Connection as Robot,
  Document
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const selectedDays = ref(1)
const loading = ref(false)
const loadingOS = ref(false)
const loadingBrowser = ref(false)
const loadingDevice = ref(false)
const loadingCountry = ref(false)
const loadingSource = ref(false)
const loadingURL = ref(false)

// 数据存储
const osData = ref([])
const browserData = ref([])
const deviceData = ref([])
const countryData = ref([])
const sourceData = ref([])
const urlData = ref([])

// 图表引用
const osChartRef = ref(null)
const browserChartRef = ref(null)
const deviceChartRef = ref(null)
const countryChartRef = ref(null)

// 图表实例
let osChart = null
let browserChart = null
let deviceChart = null
let countryChart = null

// 计算属性
const totalUsers = computed(() => {
  const allData = [...osData.value, ...browserData.value, ...deviceData.value, ...countryData.value, ...sourceData.value, ...urlData.value]
  if (allData.length === 0) return 0
  return Math.max(...allData.map(item => item.distinctUsers || 0))
})

const totalSessions = computed(() => {
  const allData = [...osData.value, ...browserData.value, ...deviceData.value, ...countryData.value, ...sourceData.value, ...urlData.value]
  if (allData.length === 0) return 0
  return allData.reduce((sum, item) => sum + (item.totalSessions || 0), 0)
})

const totalBotSessions = computed(() => {
  const allData = [...osData.value, ...browserData.value, ...deviceData.value, ...countryData.value, ...sourceData.value, ...urlData.value]
  if (allData.length === 0) return 0
  return allData.reduce((sum, item) => sum + (item.totalBotSessions || 0), 0)
})

const avgPagesPerSession = computed(() => {
  const allData = [...osData.value, ...browserData.value, ...deviceData.value, ...countryData.value, ...sourceData.value, ...urlData.value]
  if (allData.length === 0) return '0.00'
  const avg = allData.reduce((sum, item, index, arr) => sum + (item.pagesPerSession || 0), 0) / allData.length
  return avg.toFixed(2)
})

// 方法
const handleDaysChange = (days) => {
  selectedDays.value = days
  refreshData()
}

const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadOSData(),
      loadBrowserData(),
      loadDeviceData(),
      loadCountryData(),
      loadSourceData(),
      loadURLData()
    ])
    ElMessage.success('Clarity数据刷新完成')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

const loadOSData = async () => {
  loadingOS.value = true
  try {
    const data = await fetchClarityTrafficByOS(selectedDays.value)
    osData.value = data || []
    await nextTick()
    renderOSChart()
  } catch (error) {
    console.error('加载OS数据失败:', error)
  } finally {
    loadingOS.value = false
  }
}

const loadBrowserData = async () => {
  loadingBrowser.value = true
  try {
    const data = await fetchClarityTrafficByBrowser(selectedDays.value)
    browserData.value = data || []
    await nextTick()
    renderBrowserChart()
  } catch (error) {
    console.error('加载浏览器数据失败:', error)
  } finally {
    loadingBrowser.value = false
  }
}

const loadDeviceData = async () => {
  loadingDevice.value = true
  try {
    const data = await fetchClarityTrafficByDevice(selectedDays.value)
    deviceData.value = data || []
    await nextTick()
    renderDeviceChart()
  } catch (error) {
    console.error('加载设备数据失败:', error)
  } finally {
    loadingDevice.value = false
  }
}

const loadCountryData = async () => {
  loadingCountry.value = true
  try {
    const data = await fetchClarityTrafficByCountry(selectedDays.value)
    countryData.value = data || []
    await nextTick()
    renderCountryChart()
  } catch (error) {
    console.error('加载国家数据失败:', error)
  } finally {
    loadingCountry.value = false
  }
}

const loadSourceData = async () => {
  loadingSource.value = true
  try {
    const data = await fetchClarityTrafficBySource(selectedDays.value)
    sourceData.value = data || []
  } catch (error) {
    console.error('加载来源数据失败:', error)
  } finally {
    loadingSource.value = false
  }
}

const loadURLData = async () => {
  loadingURL.value = true
  try {
    const data = await fetchClarityTrafficByURL(selectedDays.value)
    urlData.value = data || []
  } catch (error) {
    console.error('加载URL数据失败:', error)
  } finally {
    loadingURL.value = false
  }
}

// 图表渲染方法
const renderPieChart = (chartRef, chartInstance, data, dimension) => {
  if (!chartRef.value || !data || data.length === 0) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const chartData = data.map(item => ({
    name: item[dimension] || '未知',
    value: item.totalSessions || 0
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'var(--text-primary)'
      }
    },
    series: [
      {
        name: '会话分布',
        type: 'pie',
        radius: '50%',
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)
  return chartInstance
}

const renderOSChart = () => {
  osChart = renderPieChart(osChartRef, osChart, osData.value, 'os')
}

const renderBrowserChart = () => {
  browserChart = renderPieChart(browserChartRef, browserChart, browserData.value, 'browser')
}

const renderDeviceChart = () => {
  deviceChart = renderPieChart(deviceChartRef, deviceChart, deviceData.value, 'device')
}

const renderCountryChart = () => {
  countryChart = renderPieChart(countryChartRef, countryChart, countryData.value, 'country/region')
}

const formatURL = (url) => {
  if (!url) return '-'
  return url.length > 40 ? url.substring(0, 40) + '...' : url
}

// 生命周期
onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.clarity-analysis {
  .clarity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px;
    background: var(--bg-primary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .metrics-overview {
    margin-bottom: 20px;

    .metric-card {
      :deep(.el-card__body) {
        padding: 16px;
      }

      .metric-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--primary-color), var(--primary-color-light));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
        }

        .metric-data {
          flex: 1;

          .metric-value {
            font-size: 24px;
            font-weight: 600;
            color: var(--text-primary);
            line-height: 1;
          }

          .metric-label {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 4px;
          }
        }
      }
    }
  }

  .chart-card,
  .table-card {
    :deep(.el-card__header) {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
          font-weight: 600;
          color: var(--text-primary);
        }
      }
    }

    :deep(.el-card__body) {
      padding: 16px;
    }

    .chart-container {
      height: 300px;
      width: 100%;
    }

    .no-data {
      text-align: center;
      color: var(--text-secondary);
      padding: 40px 0;
    }
  }

  .url-text {
    font-size: 12px;
    color: var(--text-primary);
  }

  .api-notice {
    margin-top: 20px;
  }

  :deep(.el-table) {
    --el-table-border-color: var(--border-color);
    --el-table-header-bg-color: var(--bg-primary);
    --el-table-row-hover-bg-color: var(--bg-secondary);

    th {
      background-color: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-weight: 600;
    }

    td {
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      color: var(--text-primary);
    }

    .el-table__row {
      background-color: var(--bg-primary);

      &:hover > td {
        background-color: var(--bg-secondary);
      }
    }
  }

  :deep(.el-card) {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
  }

  :deep(.el-radio-group) {
    .el-radio-button__inner {
      background-color: var(--bg-secondary);
      border-color: var(--border-color);
      color: var(--text-primary);

      &:hover {
        color: var(--primary-color);
      }
    }

    .el-radio-button:first-child .el-radio-button__inner {
      border-left-color: var(--border-color);
    }

    .el-radio-button__original:checked + .el-radio-button__inner {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
  }
}
</style> 