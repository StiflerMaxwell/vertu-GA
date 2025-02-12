import axios from 'axios'

const BASE_URL = 'https://www.googleapis.com/webmasters/v3'
const SITE_URL = import.meta.env.VITE_GSC_SITE_URL
const CLIENT_ID = import.meta.env.VITE_GSC_CLIENT_ID

// 初始化 Google OAuth
function initGoogleAuth() {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => {
      google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        callback: (response) => {
          if (response.access_token) {
            localStorage.setItem('gsc_token', response.access_token)
            resolve(response.access_token)
          }
        },
      })
    }
    document.body.appendChild(script)
  })
}

// 获取 token
async function getAccessToken() {
  const token = localStorage.getItem('gsc_token')
  if (token) {
    return token
  }
  return await initGoogleAuth()
}

// 获取 Search Console 数据
export async function fetchGscData({
  startDate,
  endDate,
  dimensions = ['query'],
  rowLimit = 10
}) {
  try {
    const token = await getAccessToken()

    const requestBody = {
      startDate,
      endDate
    }

    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      data: requestBody,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    return response.data
  } catch (error) {
    console.error('Search Analytics API Error:', error.response?.data || error)
    // 如果是认证错误，清除 token 并重试
    if (error.response?.status === 401) {
      localStorage.removeItem('gsc_token')
      return fetchGscData({ startDate, endDate, dimensions, rowLimit })
    }
    throw error
  }
}

// 测试连接
export async function testGSCSetup() {
  try {
    const token = await getAccessToken()
    const response = await axios({
      method: 'GET',
      url: `${BASE_URL}/sites/${encodeURIComponent(SITE_URL)}`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    console.error('Test failed:', error.response?.data || error)
    throw error
  }
}

// 计算平均点击率
function calculateAverageCtr(rows) {
  if (!rows?.length) return 0
  const totalClicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0)
  const totalImpressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0)
  return totalImpressions > 0 ? totalClicks / totalImpressions : 0
}

// 计算平均排名
function calculateAveragePosition(rows) {
  if (!rows?.length) return 0
  const totalWeight = rows.reduce((sum, row) => sum + (row.impressions || 0), 0)
  const weightedPosition = rows.reduce((sum, row) => sum + ((row.position || 0) * (row.impressions || 0)), 0)
  return totalWeight > 0 ? weightedPosition / totalWeight : 0
}

// 导出其他可能需要的函数
export const utils = {
  isValidDate: (dateStr) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    return date instanceof Date && !isNaN(date)
  },
  
  formatDate: (date) => {
    return date instanceof Date 
      ? date.toISOString().split('T')[0]
      : date
  }
}

// 处理认证
export function handleAuth() {
  const redirectUri = `${window.location.origin}/auth/callback`
  const scope = 'https://www.googleapis.com/auth/webmasters.readonly'

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=token&` +
    `scope=${scope}`

  window.location.href = authUrl
}

// 处理认证回调
export function handleAuthCallback() {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')

  if (accessToken) {
    localStorage.setItem('gsc_token', accessToken)
    window.location.href = '/'
  }
} 