import axios from 'axios';
import KJUR from 'jsrsasign';

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta';
const PROPERTY_ID = import.meta.env.VITE_GA4_PROPERTY_ID;
const SERVICE_ACCOUNT = {
  client_email: import.meta.env.VITE_GA4_CLIENT_EMAIL,
  private_key: import.meta.env.VITE_GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  token_uri: 'https://oauth2.googleapis.com/token'
};

const GSC_API = 'https://www.googleapis.com/webmasters/v3';
const SITE_URL = import.meta.env.VITE_GSC_SITE_URL;

class GA4Client {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // 检查现有token是否有效
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const payload = {
      iss: import.meta.env.VITE_GSC_CLIENT_EMAIL,
      sub: import.meta.env.VITE_GSC_CLIENT_EMAIL,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly'  // 添加 GSC 的 scope
      ].join(' ')
    };

    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const privateKey = import.meta.env.VITE_GSC_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    try {
      const jwt = KJUR.jws.JWS.sign('RS256', sHeader, sPayload, privateKey);
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }

  async fetchAnalyticsData(dateRange = '30') {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${GA4_API}/properties/${PROPERTY_ID}:runReport`,
        {
          dateRanges: [
            {
              startDate: `${dateRange}daysAgo`,
              endDate: 'today'
            }
          ],
          metrics: [
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' }
          ],
          dimensions: [
            { name: 'date' }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('GA4 API Error:', error);
      throw error;
    }
  }

  async runReport(report) {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${GA4_API}/properties/${PROPERTY_ID}:runReport`,
        report,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('GA4 API Error:', error);
      throw error;
    }
  }

  async runRealtimeReport(report) {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${GA4_API}/properties/${PROPERTY_ID}:runRealtimeReport`,
        report,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('GA4 Realtime API Error:', error);
      throw error;
    }
  }

  // GSC 方法
  async fetchSearchAnalytics(startDate, endDate) {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${GSC_API}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
        {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('GSC response:', response.data);
      return response.data.rows || [];
    } catch (error) {
      console.error('GSC API Error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  }

  async fetchSearchAnalyticsByPath(startDate, endDate) {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${GSC_API}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
        {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.rows || [];
    } catch (error) {
      console.error('GSC API Error:', error);
      throw error;
    }
  }
}

export const ga4Client = new GA4Client();

export async function fetchTrendData(startDate = '30daysAgo', endDate = 'today') {
  try {
    // 打印完整的请求配置
    const requestConfig = {
      dateRanges: [
        {
          startDate: startDate,
          endDate: endDate
        }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      dimensions: [
        { name: 'date' }
      ],
      orderBys: [
        {
          dimension: {
            orderType: 'NUMERIC',
            dimensionName: 'date'
          }
        }
      ]
    }
    
    console.log('GA4 完整请求配置:', JSON.stringify(requestConfig, null, 2))

    const response = await ga4Client.runReport(requestConfig)
    console.log('GA4 响应数据:', response)

    return response.rows
  } catch (error) {
    console.error('GA4 API Error:', error)
    // 打印更详细的错误信息
    if (error.response) {
      console.error('错误响应数据:', error.response.data)
      console.error('错误状态码:', error.response.status)
      console.error('错误头信息:', error.response.headers)
    } else if (error.request) {
      console.error('请求未收到响应:', error.request)
    } else {
      console.error('错误信息:', error.message)
    }
    console.error('错误配置:', error.config)
    throw error
  }
}

export async function fetchGeoDistribution(startDate = '30daysAgo', endDate = 'today') {
  try {
    const response = await ga4Client.runReport({
      dateRanges: [
        {
          startDate: startDate,
          endDate: endDate
        }
      ],
      dimensions: [
        { name: 'country' }
      ],
      metrics: [
        { name: 'activeUsers' }
      ]
    })

    return response.rows.map(row => ({
      name: row.dimensionValues[0].value || '(not set)',
      value: parseInt(row.metricValues[0].value, 10)
    }))
  } catch (error) {
    console.error('GA4 API Error:', error)
    throw error
  }
}

export async function fetchDeviceDistribution(startDate = '30daysAgo', endDate = 'today') {
  try {
    const response = await ga4Client.runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [
        {
          metric: { metricName: 'activeUsers' },
          desc: true
        }
      ]
    });

    return response.rows.map(row => ({
      name: row.dimensionValues[0].value,
      value: parseInt(row.metricValues[0].value, 10)
    }));
  } catch (error) {
    console.error('Error fetching device distribution:', error);
    throw error;
  }
}

export async function fetchSourceDistribution(startDate = '30daysAgo', endDate = 'today') {
  try {
    const response = await ga4Client.runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [
        {
          metric: { metricName: 'activeUsers' },
          desc: true
        }
      ],
      limit: 10
    });

    return response.rows.map(row => ({
      name: row.dimensionValues[0].value || '(not set)',
      value: parseInt(row.metricValues[0].value, 10)
    }));
  } catch (error) {
    console.error('Error fetching source distribution:', error);
    throw error;
  }
}

export async function fetchRealtimeMetrics() {
  try {
    const response = await ga4Client.runRealtimeReport({
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      minuteRanges: [
        {
          name: 'current',
          startMinutesAgo: 30,
          endMinutesAgo: 0
        }
      ]
    })

    console.log('Realtime response:', response)
    return response.rows?.[0] || null
  } catch (error) {
    console.error('GA4 Realtime API Error:', error)
    throw error
  }
}

// 导出 GSC 相关函数
export async function fetchSearchData(startDate, endDate, type = 'query') {
  try {
    if (type === 'query') {
      return await ga4Client.fetchSearchAnalytics(startDate, endDate);
    } else {
      return await ga4Client.fetchSearchAnalyticsByPath(startDate, endDate);
    }
  } catch (error) {
    console.error('Error fetching search data:', error);
    throw error;
  }
}