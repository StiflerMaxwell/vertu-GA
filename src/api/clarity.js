import axios from 'axios';

const CLARITY_API_BASE = 'https://www.clarity.ms/export-data/api/v1';
const CLARITY_API_TOKEN = import.meta.env.VITE_CLARITY_API_TOKEN;

class ClarityClient {
  constructor() {
    this.apiToken = CLARITY_API_TOKEN;
  }

  async fetchProjectLiveInsights(numOfDays = 1, dimensions = {}) {
    try {
      if (!this.apiToken) {
        console.warn('Clarity API Token not configured');
        return null;
      }

      const params = {
        numOfDays: numOfDays
      };

      // 添加维度参数
      if (dimensions.dimension1) params.dimension1 = dimensions.dimension1;
      if (dimensions.dimension2) params.dimension2 = dimensions.dimension2;
      if (dimensions.dimension3) params.dimension3 = dimensions.dimension3;

      const response = await axios.get(
        `${CLARITY_API_BASE}/project-live-insights`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Clarity API Error:', error);
      
      if (error.response?.status === 401) {
        console.error('Clarity API: 认证失败，请检查API Token');
      } else if (error.response?.status === 403) {
        console.error('Clarity API: 权限不足');
      } else if (error.response?.status === 400) {
        console.error('Clarity API: 请求参数无效');
      } else if (error.response?.status === 429) {
        console.error('Clarity API: 请求次数超限（每日限制10次）');
      }
      
      throw error;
    }
  }

  // 获取交通数据（按操作系统分组）
  async getTrafficByOS(numOfDays = 1) {
    return await this.fetchProjectLiveInsights(numOfDays, {
      dimension1: 'OS'
    });
  }

  // 获取交通数据（按浏览器分组）
  async getTrafficByBrowser(numOfDays = 1) {
    return await this.fetchProjectLiveInsights(numOfDays, {
      dimension1: 'Browser'
    });
  }

  // 获取交通数据（按设备分组）
  async getTrafficByDevice(numOfDays = 1) {
    return await this.fetchProjectLiveInsights(numOfDays, {
      dimension1: 'Device'
    });
  }

  // 获取交通数据（按国家/地区分组）
  async getTrafficByCountry(numOfDays = 1) {
    return await this.fetchProjectLiveInsights(numOfDays, {
      dimension1: 'Country/Region'
    });
  }

  // 获取交通数据（按来源分组）
  async getTrafficBySource(numOfDays = 1) {
    return await this.fetchProjectLiveInsights(numOfDays, {
      dimension1: 'Source'
    });
  }

  // 获取交通数据（按URL分组）
  async getTrafficByURL(numOfDays = 1) {
    return await this.fetchProjectLiveInsights(numOfDays, {
      dimension1: 'URL'
    });
  }

  // 获取多维度交通数据（按设备、浏览器和国家分组）
  async getMultiDimensionTraffic(numOfDays = 1) {
    return await this.fetchProjectLiveInsights(numOfDays, {
      dimension1: 'Device',
      dimension2: 'Browser',
      dimension3: 'Country/Region'
    });
  }

  // 解析Clarity响应数据
  parseTrafficData(data) {
    if (!data || !Array.isArray(data)) return null;

    const trafficMetric = data.find(metric => metric.metricName === 'Traffic');
    if (!trafficMetric || !trafficMetric.information) return null;

    return trafficMetric.information.map(item => ({
      totalSessions: parseInt(item.totalSessionCount) || 0,
      totalBotSessions: parseInt(item.totalBotSessionCount) || 0,
      distinctUsers: parseInt(item.distantUserCount) || 0,
      pagesPerSession: parseFloat(item.PagesPerSessionPercentage) || 0,
      // 动态获取维度值
      ...Object.keys(item).reduce((acc, key) => {
        if (!['totalSessionCount', 'totalBotSessionCount', 'distantUserCount', 'PagesPerSessionPercentage'].includes(key)) {
          acc[key.toLowerCase()] = item[key];
        }
        return acc;
      }, {})
    }));
  }

  // 获取滚动深度数据
  async getScrollDepthMetrics(numOfDays = 1) {
    try {
      const data = await this.fetchProjectLiveInsights(numOfDays);
      return this.parseScrollDepthData(data);
    } catch (error) {
      console.error('Failed to fetch scroll depth metrics:', error);
      return null;
    }
  }

  // 解析滚动深度数据
  parseScrollDepthData(data) {
    if (!data || !Array.isArray(data)) return null;

    // Clarity API 可能返回不同的结构，我们需要更灵活的解析
    const scrollMetrics = data.find(metric => 
      metric.metricName === 'Scroll Depth' || 
      metric.metricName === 'ScrollDepth' ||
      metric.type === 'scrollDepth'
    );

    if (!scrollMetrics?.information) {
      // 如果没有专门的滚动深度数据，尝试从其他指标中提取
      return {
        data: [{
          AverageScrollDepth: 0,
          Sessions: 0,
          Users: 0,
          URL: '/'
        }]
      };
    }

    const processedData = scrollMetrics.information.map(item => ({
      AverageScrollDepth: parseFloat(item.averageScrollDepth || item.AverageScrollDepth || 0),
      Sessions: parseInt(item.totalSessionCount || item.Sessions || 0),
      Users: parseInt(item.distinctUserCount || item.Users || 0),
      URL: item.URL || item.url || '/'
    }));

    // 返回与DataInsights组件期望的格式一致的数据
    return {
      data: processedData,
      // 计算汇总指标
      avgScrollDepth: processedData.length > 0 
        ? processedData.reduce((sum, item) => sum + item.AverageScrollDepth, 0) / processedData.length 
        : 0,
      totalSessions: processedData.reduce((sum, item) => sum + item.Sessions, 0),
      totalUsers: processedData.reduce((sum, item) => sum + item.Users, 0)
    };
  }

  // 获取其他指标数据
  parseMetricsData(data) {
    if (!data || !Array.isArray(data)) return {};

    const metrics = {};
    
    data.forEach(metric => {
      if (metric.metricName && metric.information) {
        metrics[metric.metricName] = metric.information;
      }
    });

    return metrics;
  }
}

// 创建全局实例
export const clarityClient = new ClarityClient();

// 导出便捷函数
export async function fetchClarityTrafficByOS(numOfDays = 1) {
  try {
    const data = await clarityClient.getTrafficByOS(numOfDays);
    return clarityClient.parseTrafficData(data);
  } catch (error) {
    console.error('Failed to fetch Clarity traffic by OS:', error);
    return null;
  }
}

export async function fetchClarityTrafficByBrowser(numOfDays = 1) {
  try {
    const data = await clarityClient.getTrafficByBrowser(numOfDays);
    return clarityClient.parseTrafficData(data);
  } catch (error) {
    console.error('Failed to fetch Clarity traffic by Browser:', error);
    return null;
  }
}

export async function fetchClarityTrafficByDevice(numOfDays = 1) {
  try {
    const data = await clarityClient.getTrafficByDevice(numOfDays);
    return clarityClient.parseTrafficData(data);
  } catch (error) {
    console.error('Failed to fetch Clarity traffic by Device:', error);
    return null;
  }
}

export async function fetchClarityTrafficByCountry(numOfDays = 1) {
  try {
    const data = await clarityClient.getTrafficByCountry(numOfDays);
    return clarityClient.parseTrafficData(data);
  } catch (error) {
    console.error('Failed to fetch Clarity traffic by Country:', error);
    return null;
  }
}

export async function fetchClarityTrafficBySource(numOfDays = 1) {
  try {
    const data = await clarityClient.getTrafficBySource(numOfDays);
    return clarityClient.parseTrafficData(data);
  } catch (error) {
    console.error('Failed to fetch Clarity traffic by Source:', error);
    return null;
  }
}

export async function fetchClarityTrafficByURL(numOfDays = 1) {
  try {
    const data = await clarityClient.getTrafficByURL(numOfDays);
    return clarityClient.parseTrafficData(data);
  } catch (error) {
    console.error('Failed to fetch Clarity traffic by URL:', error);
    return null;
  }
}

export async function fetchClarityMetrics(numOfDays = 1) {
  try {
    const data = await clarityClient.fetchProjectLiveInsights(numOfDays);
    return clarityClient.parseMetricsData(data);
  } catch (error) {
    console.error('Failed to fetch Clarity metrics:', error);
    return null;
  }
}

export default clarityClient; 