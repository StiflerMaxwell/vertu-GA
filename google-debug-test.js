// Google 服务连接调试测试脚本
// 在您的另一个项目中运行此脚本来诊断问题

import axios from 'axios'
import KJUR from 'jsrsasign'

// 🔧 配置检查函数
export function checkEnvironmentConfig() {
  console.log('🔍 === 环境变量配置检查 ===')
  
  const requiredVars = [
    'VITE_GA4_PROPERTY_ID',
    'VITE_GA4_CLIENT_EMAIL', 
    'VITE_GA4_PRIVATE_KEY',
    'VITE_GSC_SITE_URL',
    'VITE_GSC_CLIENT_EMAIL',
    'VITE_GSC_PRIVATE_KEY'
  ]
  
  const results = {}
  
  requiredVars.forEach(varName => {
    const value = import.meta.env[varName]
    results[varName] = {
      exists: !!value,
      hasContent: value && value.length > 0,
      preview: value ? `${value.substring(0, 20)}...` : 'MISSING'
    }
  })
  
  console.table(results)
  
  // 特别检查私钥格式
  const privateKey = import.meta.env.VITE_GA4_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (privateKey) {
    console.log('🔑 私钥格式详细检查:')
    console.log('- 开始标记:', privateKey.includes('-----BEGIN PRIVATE KEY-----') ? '✅' : '❌')
    console.log('- 结束标记:', privateKey.includes('-----END PRIVATE KEY-----') ? '✅' : '❌') 
    console.log('- 总长度:', privateKey.length)
    console.log('- 行数:', privateKey.split('\n').length)
  }
  
  return results
}

// 🔐 JWT认证测试
export async function testJWTGeneration() {
  console.log('\n🔐 === JWT认证测试 ===')
  
  try {
    const now = Math.floor(Date.now() / 1000)
    const clientEmail = import.meta.env.VITE_GA4_CLIENT_EMAIL
    const privateKey = import.meta.env.VITE_GA4_PRIVATE_KEY?.replace(/\\n/g, '\n')
    
    if (!clientEmail || !privateKey) {
      throw new Error('缺少必要的认证信息')
    }
    
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }
    
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly'
      ].join(' ')
    }
    
    console.log('📋 JWT payload:', {
      issuer: payload.iss,
      audience: payload.aud,
      scope: payload.scope
    })
    
    const jwt = KJUR.jws.JWS.sign('RS256', JSON.stringify(header), JSON.stringify(payload), privateKey)
    console.log('✅ JWT生成成功')
    console.log('🔖 JWT长度:', jwt.length)
    
    return jwt
    
  } catch (error) {
    console.error('❌ JWT生成失败:', error.message)
    console.error('详细错误:', error)
    throw error
  }
}

// 🎫 Access Token获取测试
export async function testAccessToken(jwt) {
  console.log('\n🎫 === Access Token获取测试 ===')
  
  try {
    console.log('📤 发送Token请求...')
    
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }, {
      timeout: 10000, // 10秒超时
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    
    console.log('✅ Access Token获取成功')
    console.log('🔖 Token类型:', response.data.token_type)
    console.log('⏰ 过期时间:', response.data.expires_in, '秒')
    console.log('🎯 Token预览:', response.data.access_token.substring(0, 30) + '...')
    
    return response.data.access_token
    
  } catch (error) {
    console.error('❌ Access Token获取失败')
    
    if (error.response) {
      console.error('HTTP状态:', error.response.status)
      console.error('错误响应:', error.response.data)
    } else if (error.request) {
      console.error('请求错误:', error.message)
    } else {
      console.error('其他错误:', error.message)
    }
    
    throw error
  }
}

// 📊 GA4 API连接测试
export async function testGA4Connection(accessToken) {
  console.log('\n📊 === GA4 API连接测试 ===')
  
  try {
    const propertyId = import.meta.env.VITE_GA4_PROPERTY_ID
    
    if (!propertyId) {
      throw new Error('GA4 Property ID未设置')
    }
    
    console.log('🎯 测试属性ID:', propertyId)
    console.log('📤 发送GA4 API请求...')
    
    const response = await axios.post(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        dateRanges: [{ 
          startDate: '7daysAgo', 
          endDate: 'today' 
        }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15秒超时
      }
    )
    
    console.log('✅ GA4 API调用成功')
    console.log('📈 数据行数:', response.data.rows?.length || 0)
    
    if (response.data.rows?.length > 0) {
      const firstRow = response.data.rows[0]
      console.log('📊 示例数据:')
      console.log('- 活跃用户:', firstRow.metricValues[0]?.value || '0')
      console.log('- 页面浏览量:', firstRow.metricValues[1]?.value || '0')
    }
    
    return response.data
    
  } catch (error) {
    console.error('❌ GA4 API调用失败')
    
    if (error.response) {
      console.error('HTTP状态:', error.response.status)
      console.error('错误详情:', error.response.data)
      
      // 特定错误提示
      if (error.response.status === 403) {
        console.error('💡 可能原因: 服务账号没有添加到GA4属性，或权限不足')
      } else if (error.response.status === 404) {
        console.error('💡 可能原因: GA4属性ID错误或不存在')
      }
    }
    
    throw error
  }
}

// 🔍 GSC API连接测试  
export async function testGSCConnection(accessToken) {
  console.log('\n🔍 === GSC API连接测试 ===')
  
  try {
    const siteUrl = import.meta.env.VITE_GSC_SITE_URL
    
    if (!siteUrl) {
      throw new Error('GSC Site URL未设置')
    }
    
    console.log('🌐 测试网站URL:', siteUrl)
    console.log('📤 发送GSC API请求...')
    
    const response = await axios.post(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    )
    
    console.log('✅ GSC API调用成功')
    console.log('📈 数据行数:', response.data.rows?.length || 0)
    
    if (response.data.rows?.length > 0) {
      console.log('🔍 示例查询词:')
      response.data.rows.slice(0, 3).forEach((row, index) => {
        console.log(`${index + 1}. "${row.keys[0]}" - 点击数: ${row.clicks}`)
      })
    }
    
    return response.data
    
  } catch (error) {
    console.error('❌ GSC API调用失败')
    
    if (error.response) {
      console.error('HTTP状态:', error.response.status)  
      console.error('错误详情:', error.response.data)
      
      if (error.response.status === 403) {
        console.error('💡 可能原因: 服务账号没有添加到Search Console，或权限不足')
      } else if (error.response.status === 404) {
        console.error('💡 可能原因: 网站URL错误或未在Search Console中验证')
      }
    }
    
    throw error
  }
}

// 🚀 完整测试流程
export async function runCompleteTest() {
  console.log('🚀 === Google服务完整连接测试开始 ===\n')
  
  const results = {
    envCheck: false,
    jwtGeneration: false,
    accessToken: false,
    ga4Connection: false,
    gscConnection: false
  }
  
  try {
    // 1. 环境变量检查
    checkEnvironmentConfig()
    results.envCheck = true
    
    // 2. JWT生成测试
    const jwt = await testJWTGeneration()
    results.jwtGeneration = true
    
    // 3. Access Token获取
    const accessToken = await testAccessToken(jwt)
    results.accessToken = true
    
    // 4. GA4连接测试
    try {
      await testGA4Connection(accessToken)
      results.ga4Connection = true
    } catch (error) {
      console.log('⚠️ GA4测试失败，继续GSC测试...')
    }
    
    // 5. GSC连接测试
    try {
      await testGSCConnection(accessToken)
      results.gscConnection = true
    } catch (error) {
      console.log('⚠️ GSC测试失败')
    }
    
  } catch (error) {
    console.error('💥 测试流程中断:', error.message)
  }
  
  // 6. 测试结果总结
  console.log('\n📊 === 测试结果总结 ===')
  console.table(results)
  
  const successCount = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n🎯 成功率: ${successCount}/${totalTests} (${(successCount/totalTests*100).toFixed(1)}%)`)
  
  if (successCount === totalTests) {
    console.log('🎉 所有测试通过！您的配置完全正常。')
  } else {
    console.log('⚠️ 部分测试失败，请检查上述错误信息和解决建议。')
  }
  
  return results
}

// 在控制台中运行测试
if (typeof window !== 'undefined') {
  window.debugGoogleServices = runCompleteTest
  console.log('💡 在浏览器控制台中运行: debugGoogleServices()')
} 