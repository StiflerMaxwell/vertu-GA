// 使用 PageSpeed Insights API (基于 Lighthouse)
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const BASE_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export async function runLighthouseTest(url, options = {}) {
  const { device = 'desktop' } = options
  
  try {
    const params = new URLSearchParams({
      url: url,
      key: API_KEY,
      strategy: device === 'mobile' ? 'mobile' : 'desktop'
    }).toString()

    const response = await fetch(`${BASE_URL}?${params}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('API Error:', errorData)
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || !data.lighthouseResult) {
      throw new Error('Invalid response data')
    }

    return {
      device: device, // 添加设备类型到返回数据中
      performance: Math.round((data.lighthouseResult.categories?.performance?.score || 0) * 100),
      accessibility: Math.round((data.lighthouseResult.categories?.accessibility?.score || 0) * 100),
      bestPractices: Math.round((data.lighthouseResult.categories?.['best-practices']?.score || 0) * 100),
      seo: Math.round((data.lighthouseResult.categories?.seo?.score || 0) * 100),
      fcp: data.lighthouseResult.audits?.['first-contentful-paint']?.displayValue || '-',
      lcp: data.lighthouseResult.audits?.['largest-contentful-paint']?.displayValue || '-',
      cls: data.lighthouseResult.audits?.['cumulative-layout-shift']?.displayValue || '-',
      si: data.lighthouseResult.audits?.['speed-index']?.displayValue || '-',
      tbt: data.lighthouseResult.audits?.['total-blocking-time']?.displayValue || '-',
      fcp_score: Math.round((data.lighthouseResult.audits?.['first-contentful-paint']?.score || 0) * 100),
      lcp_score: Math.round((data.lighthouseResult.audits?.['largest-contentful-paint']?.score || 0) * 100),
      cls_score: Math.round((data.lighthouseResult.audits?.['cumulative-layout-shift']?.score || 0) * 100),
      si_score: Math.round((data.lighthouseResult.audits?.['speed-index']?.score || 0) * 100),
      tbt_score: Math.round((data.lighthouseResult.audits?.['total-blocking-time']?.score || 0) * 100),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Lighthouse test error:', error)
    throw error
  }
} 