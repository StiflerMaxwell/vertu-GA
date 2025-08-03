# Google 服务连接调试指南

## 🔧 **完整配置检查清单**

### 1. **Google Cloud Console 设置**

#### 步骤1：创建服务账号
```bash
1. 访问 Google Cloud Console
2. 选择项目 → IAM和管理 → 服务账号
3. 创建服务账号 → 填写名称和描述
4. 角色分配：
   - Google Analytics Admin（可选择Viewer）
   - Search Console Service Agent
```

#### 步骤2：生成密钥
```bash
1. 点击服务账号 → 密钥选项卡
2. 添加密钥 → 创建新密钥 → JSON格式
3. 下载JSON文件，提取以下信息：
   - client_email
   - private_key
   - project_id
```

#### 步骤3：启用API
```bash
必须启用的API：
✅ Google Analytics Data API
✅ Google Search Console API
✅ Google Analytics Reporting API (可选)
```

### 2. **GA4 属性设置**

#### 获取属性ID：
```bash
1. 登录 Google Analytics 4
2. 管理 → 属性设置 → 属性详情
3. 属性ID 格式：123456789（纯数字）
```

#### 添加服务账号：
```bash
1. GA4 → 管理 → 账号访问管理
2. 添加用户 → 输入服务账号邮箱
3. 权限：查看器（Viewer）或分析师（Analyst）
```

### 3. **Search Console 设置**

#### 添加网站属性：
```bash
1. 登录 Google Search Console
2. 添加资源 → 网址前缀 → 输入完整域名
3. 验证所有权（DNS/HTML文件/Google Analytics）
```

#### 添加服务账号：
```bash
1. 设置 → 用户和权限
2. 添加用户 → 输入服务账号邮箱  
3. 权限：完整（Full）或限制（Restricted）
```

## 🚨 **常见错误和解决方案**

### 错误1：403 Forbidden - 权限错误
```bash
错误信息：
"The caller does not have permission"
"User does not have sufficient permissions"

解决方案：
1. 检查服务账号是否添加到GA4和GSC
2. 确认权限级别（至少Viewer）
3. 等待10-15分钟权限生效
```

### 错误2：400 Bad Request - 私钥格式错误
```bash
错误信息：
"Invalid JWT signature"
"Invalid key format"

解决方案：
1. 检查私钥换行符：replace(/\\n/g, '\n')
2. 确保包含完整的 BEGIN/END 标记
3. 检查特殊字符转义
```

### 错误3：401 Unauthorized - 认证失败
```bash
错误信息：
"Request had invalid authentication credentials"

解决方案：
1. 检查client_email格式
2. 确认项目ID匹配
3. 重新生成服务账号密钥
```

### 错误4：404 Not Found - 资源不存在
```bash
错误信息：
"Property not found"
"Site not found"

解决方案：
1. 确认GA4属性ID正确（纯数字）
2. 确认GSC网站URL完整（包含https://）
3. 检查资源是否已添加到相应平台
```

## 🔍 **调试代码模板**

### 测试连接的调试代码：
```javascript
// 添加到项目中进行测试
export async function debugGoogleConnection() {
  console.log('🔍 开始Google服务连接测试...')
  
  // 1. 检查环境变量
  const envCheck = {
    GA4_PROPERTY_ID: !!import.meta.env.VITE_GA4_PROPERTY_ID,
    GA4_CLIENT_EMAIL: !!import.meta.env.VITE_GA4_CLIENT_EMAIL,
    GA4_PRIVATE_KEY: !!import.meta.env.VITE_GA4_PRIVATE_KEY,
    GSC_SITE_URL: !!import.meta.env.VITE_GSC_SITE_URL,
    GSC_CLIENT_EMAIL: !!import.meta.env.VITE_GSC_CLIENT_EMAIL,
    GSC_PRIVATE_KEY: !!import.meta.env.VITE_GSC_PRIVATE_KEY
  }
  console.log('📋 环境变量检查:', envCheck)
  
  // 2. 检查私钥格式
  const privateKey = import.meta.env.VITE_GA4_PRIVATE_KEY?.replace(/\\n/g, '\n')
  console.log('🔑 私钥格式检查:', {
    hasBeginMarker: privateKey?.includes('-----BEGIN PRIVATE KEY-----'),
    hasEndMarker: privateKey?.includes('-----END PRIVATE KEY-----'),
    length: privateKey?.length
  })
  
  // 3. 测试JWT生成
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
      iss: import.meta.env.VITE_GA4_CLIENT_EMAIL,
      sub: import.meta.env.VITE_GA4_CLIENT_EMAIL,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/analytics.readonly'
    }
    
    const jwt = KJUR.jws.JWS.sign('RS256', JSON.stringify(header), JSON.stringify(payload), privateKey)
    console.log('✅ JWT生成成功')
    
    // 4. 测试Token获取
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
    console.log('✅ Access Token获取成功')
    
    // 5. 测试GA4 API调用
    const ga4Response = await axios.post(
      `https://analyticsdata.googleapis.com/v1beta/properties/${import.meta.env.VITE_GA4_PROPERTY_ID}:runReport`,
      {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }]
      },
      {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log('✅ GA4 API调用成功:', ga4Response.data)
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error)
    if (error.response) {
      console.error('错误详情:', error.response.data)
    }
  }
}
```

## 📋 **快速检查步骤**

1. **复制环境变量** - 确保格式完全一致
2. **检查服务账号权限** - GA4和GSC都要添加
3. **确认API已启用** - Google Cloud Console中检查
4. **测试私钥格式** - 使用上面的调试代码
5. **等待权限生效** - 新添加的权限需要10-15分钟

## 🎯 **项目迁移建议**

### 如果要迁移到新项目：
1. **完全复制环境变量**（包括格式）
2. **安装相同版本的依赖包**
3. **复制完整的API客户端代码**
4. **确保相同的错误处理逻辑**
5. **使用相同的认证流程**

需要我帮您创建一个具体的测试脚本来调试您的另一个项目吗？ 