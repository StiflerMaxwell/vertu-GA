import axios from 'axios'
import KJUR from 'jsrsasign'

const GSC_API = 'https://www.googleapis.com/webmasters/v3'
const SITE_URL = import.meta.env.VITE_GSC_SITE_URL
const SERVICE_ACCOUNT = {
  client_email: import.meta.env.VITE_GSC_CLIENT_EMAIL,
  private_key: import.meta.env.VITE_GSC_PRIVATE_KEY?.replace(/\\n/g, '\n')
}

class GSCClient {
  constructor() {
    this.accessToken = null
    this.tokenExpiry = null
  }

  async getAccessToken() {
    // 检查现有token是否有效
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const jwt = this.createJWT()
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })

      this.accessToken = response.data.access_token
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000)
      return this.accessToken
    } catch (error) {
      console.error('Failed to get access token:', error)
      throw error
    }
  }

  createJWT() {
    const now = Math.floor(Date.now() / 1000)
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }
    
    const payload = {
      iss: SERVICE_ACCOUNT.client_email,
      sub: SERVICE_ACCOUNT.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly'
    }

    const sHeader = JSON.stringify(header)
    const sPayload = JSON.stringify(payload)
    
    return KJUR.jws.JWS.sign(
      'RS256',
      sHeader,
      sPayload,
      SERVICE_ACCOUNT.private_key
    )
  }

  async fetchSearchAnalytics(startDate, endDate, type, dimensions) {
    try {
      const token = await this.getAccessToken()
      
      const response = await axios.post(
        `${GSC_API}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
        {
          startDate,
          endDate,
          dimensions: dimensions,
          rowLimit: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      return response.data.rows || []
    } catch (error) {
      console.error('GSC API Error:', error)
      if (error.response) {
        console.error('Error response:', error.response.data)
      }
      throw error
    }
  }
}

export const gscClient = new GSCClient()

export async function fetchSearchData(startDate, endDate, type = 'query') {
  try {
    console.log('Fetching search data for:', { startDate, endDate, type });
    
    // 如果开始日期和结束日期相同，依然发送请求
    let dimensions = []
    switch (type) {
      case 'query':
        dimensions = ['query']
        break
      case 'page':
        dimensions = ['page']
        break
      case 'country':
        dimensions = ['country']
        break
      case 'device':
        dimensions = ['device']
        break
      case 'date':
        dimensions = ['date']
        break
      default:
        dimensions = ['query']
    }

    const response = await gscClient.fetchSearchAnalytics(startDate, endDate, type, dimensions);
    
    // 即使是同一天的数据，也返回结果
    return {
      rows: response || []
    };
  } catch (error) {
    console.error('Error in fetchSearchData:', error);
    throw error;
  }
}

// 导出常量供组件使用
export const DIMENSIONS = {
  QUERY: 'query',
  PAGE: 'page',
  COUNTRY: 'country',
  DEVICE: 'device',
  DATE: 'date'
}

// 导出设备类型映射
export const DEVICE_TYPES = {
  MOBILE: '移动设备',
  DESKTOP: '桌面设备',
  TABLET: '平板设备'
}

// 导出国家代码映射
export const COUNTRY_CODES = {
  IND: '印度',
  BGD: '孟加拉国',
  DEU: '德国',
  GBR: '英国',
  FRA: '法国',
  MYS: '马来西亚',
  TUR: '土耳其',
  USA: '美国',
  ITA: '意大利',
  ESP: '西班牙',
  IDN: '印度尼西亚',
  PHL: '菲律宾',
  POL: '波兰',
  PAK: '巴基斯坦',
  CZE: '捷克',
  IRN: '伊朗',
  ROU: '罗马尼亚',
  NLD: '荷兰',
  SGP: '新加坡',
  GRC: '希腊',
  THA: '泰国',
  CHE: '瑞士',
  SVK: '斯洛伐克',
  CAN: '加拿大',
  BGR: '保加利亚',
  AZE: '阿塞拜疆',
  HUN: '匈牙利',
  AUT: '奥地利',
  BEL: '比利时',
  MEX: '墨西哥',
  RUS: '俄罗斯',
  SRB: '塞尔维亚',
  LVA: '拉脱维亚',
  SAU: '沙特阿拉伯',
  AUS: '澳大利亚',
  UKR: '乌克兰',
  ARE: '阿联酋',
  SWE: '瑞典',
  BRA: '巴西',
  QAT: '卡塔尔',
  ALB: '阿尔巴尼亚',
  FIN: '芬兰',
  GEO: '格鲁吉亚',
  PRT: '葡萄牙',
  ARM: '亚美尼亚',
  VNM: '越南',
  HKG: '中国香港',
  TWN: '中国台湾',
  ISR: '以色列',
  MDA: '摩尔多瓦',
  LTU: '立陶宛',
  NGA: '尼日利亚',
  KOR: '韩国',
  UZB: '乌兹别克斯坦',
  EGY: '埃及',
  IRQ: '伊拉克',
  KAZ: '哈萨克斯坦',
  KHM: '柬埔寨',
  KWT: '科威特',
  MMR: '缅甸',
  DNK: '丹麦',
  KEN: '肯尼亚',
  MAR: '摩洛哥',
  ZAF: '南非',
  JPN: '日本',
  NZL: '新西兰',
  OMN: '阿曼',
  HRV: '克罗地亚',
  LKA: '斯里兰卡',
  BIH: '波斯尼亚和黑塞哥维那',
  CHL: '智利',
  IRL: '爱尔兰',
  CYP: '塞浦路斯',
  VEN: '委内瑞拉',
  ARG: '阿根廷',
  COL: '哥伦比亚',
  EST: '爱沙尼亚',
  MKD: '北马其顿',
  NOR: '挪威',
  NPL: '尼泊尔',
  PER: '秘鲁',
  JOR: '约旦',
  KGZ: '吉尔吉斯斯坦',
  BLR: '白俄罗斯',
  DZA: '阿尔及利亚',
  MNG: '蒙古',
  AGO: '安哥拉',
  BHR: '巴林',
  BRN: '文莱',
  CHN: '中国',
  LBN: '黎巴嫩',
  LBY: '利比亚',
  SYR: '叙利亚',
  TTO: '特立尼达和多巴哥',
  BTN: '不丹',
  DOM: '多米尼加共和国',
  ECU: '厄瓜多尔',
  LUX: '卢森堡',
  MAC: '中国澳门',
  ZZZ: '未知地区'
}

// 测试连接
export async function testGSCSetup() {
  try {
    const token = await gscClient.getAccessToken()
    const response = await axios({
      method: 'GET',
      url: `${GSC_API}/sites/${encodeURIComponent(SITE_URL)}`,
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
    `client_id=${SERVICE_ACCOUNT.client_email}&` +
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