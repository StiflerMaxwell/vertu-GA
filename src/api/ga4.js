import axios from 'axios';
import KJUR from 'jsrsasign';

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta';
const PROPERTY_ID = import.meta.env.VITE_GA4_PROPERTY_ID;
const SERVICE_ACCOUNT = {
  client_email: import.meta.env.VITE_GA4_CLIENT_EMAIL,
  private_key: import.meta.env.VITE_GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  token_uri: 'https://oauth2.googleapis.com/token'
};

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

    try {
      const response = await axios.post(SERVICE_ACCOUNT.token_uri, {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: this.createJWT()
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Authentication failed');
    }
  }

  createJWT() {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const payload = {
      iss: SERVICE_ACCOUNT.client_email,
      sub: SERVICE_ACCOUNT.client_email,
      aud: SERVICE_ACCOUNT.token_uri,
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/analytics.readonly'
    };

    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    
    return KJUR.jws.JWS.sign(
      'RS256',
      sHeader,
      sPayload,
      SERVICE_ACCOUNT.private_key
    );
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
}

export const ga4Client = new GA4Client();

export async function fetchTrendData(startDate = '30daysAgo', endDate = 'today') {
  try {
    const response = await ga4Client.runReport({
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
    });
    
    if (!response || !response.rows) {
      throw new Error('Invalid response format');
    }

    const formattedData = response.rows.map(row => {
      const date = row.dimensionValues[0].value;
      const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      
      return {
        dimensionValues: [{ value: formattedDate }],
        metricValues: [
          { value: parseInt(row.metricValues[0].value, 10) },
          { value: parseInt(row.metricValues[1].value, 10) },
          { value: parseFloat(row.metricValues[2].value) },
          { value: parseFloat(row.metricValues[3].value) }
        ]
      };
    }).sort((a, b) => {
      return new Date(a.dimensionValues[0].value) - new Date(b.dimensionValues[0].value);
    });

    return formattedData;
  } catch (error) {
    console.error('Error fetching trend data:', error);
    throw error;
  }
}

export async function fetchGeoDistribution(startDate = '30daysAgo', endDate = 'today') {
  try {
    const response = await ga4Client.runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
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
      name: row.dimensionValues[0].value,
      value: parseInt(row.metricValues[0].value, 10)
    }));
  } catch (error) {
    console.error('Error fetching geo distribution:', error);
    throw error;
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