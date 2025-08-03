/**
 * 最基本的HTTPS测试
 */

import axios from 'axios'

async function testBasicHTTPS() {
  console.log('🚀 基本HTTPS测试')
  console.log('=' .repeat(30))
  
  try {
    console.log('📡 测试1: 访问httpbin.org...')
    const response1 = await axios.get('https://httpbin.org/ip', {
      timeout: 10000
    })
    console.log('✅ httpbin.org访问成功')
    console.log(`🌐 出口IP: ${response1.data.origin}`)
    
  } catch (error1: any) {
    console.log('❌ httpbin.org访问失败:', error1.message)
    console.log(`📊 错误代码: ${error1.code}`)
  }
  
  try {
    console.log('\n📡 测试2: 访问Google首页...')
    const response2 = await axios.get('https://www.google.com', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    console.log('✅ Google首页访问成功')
    console.log(`📄 响应长度: ${response2.data.length} 字符`)
    
  } catch (error2: any) {
    console.log('❌ Google首页访问失败:', error2.message)
    console.log(`📊 错误代码: ${error2.code}`)
  }
  
  try {
    console.log('\n📡 测试3: 访问Google OAuth端点...')
    const response3 = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      timeout: 10000,
      validateStatus: () => true // 接受所有状态码
    })
    console.log('✅ Google OAuth端点访问成功')
    console.log(`📊 状态码: ${response3.status}`)
    
  } catch (error3: any) {
    console.log('❌ Google OAuth端点访问失败:', error3.message)
    console.log(`📊 错误代码: ${error3.code}`)
    
    if (error3.message.includes('protocol mismatch')) {
      console.log('🔍 发现protocol mismatch错误！')
      console.log('💡 这可能是Node.js TLS配置问题')
    }
  }
}

testBasicHTTPS()
  .then(() => {
    console.log('\n🏁 基本测试完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 未预期错误:', error)
    process.exit(1)
  }) 