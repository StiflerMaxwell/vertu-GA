import axios from 'axios'

const GSC_API = 'https://searchconsole.googleapis.com/webmasters/v3/sites'
const SITE_URL = import.meta.env.VITE_GSC_SITE_URL
const CLIENT_ID = import.meta.env.VITE_GSC_CLIENT_ID

// 获取 GSC 数据
export async function fetchGscData(startDate, endDate) {
  try {
    console.log('Getting access token...')
    const token = await getAccessToken()
    console.log('Token received, making API request...')
    
    const response = await axios.post(
      `${GSC_API}/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 5000
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log('Raw API response:', response.data)

    const processedData = {
      keywords: response.data.rows || [],
      totalKeywords: response.data.rows?.length || 0,
      clicks: response.data.rows?.reduce((sum, row) => sum + row.clicks, 0) || 0,
      impressions: response.data.rows?.reduce((sum, row) => sum + row.impressions, 0) || 0,
      avgPosition: calculateAvgPosition(response.data.rows || [])
    }
    
    console.log('Processed data:', processedData)
    return processedData

  } catch (error) {
    console.error('GSC API Error:', error)
    if (error.response) {
      console.error('Error response:', error.response.data)
      console.error('Error status:', error.response.status)
    }
    throw error
  }
}

// 计算平均排名
function calculateAvgPosition(rows) {
  if (!rows.length) return 0
  const totalWeight = rows.reduce((sum, row) => sum + row.impressions, 0)
  const weightedPosition = rows.reduce((sum, row) => sum + (row.position * row.impressions), 0)
  return totalWeight > 0 ? weightedPosition / totalWeight : 0
}

// 获取访问令牌
async function getAccessToken() {
  try {
    console.log('Creating JWT...')
    const jwt = createJWT()
    console.log('JWT created, requesting token...')
    
    const response = await axios.post(SERVICE_ACCOUNT.token_uri, {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
    
    console.log('Token received successfully')
    return response.data.access_token
  } catch (error) {
    console.error('Token Error:', error)
    if (error.response) {
      console.error('Token error details:', error.response.data)
    }
    throw error
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