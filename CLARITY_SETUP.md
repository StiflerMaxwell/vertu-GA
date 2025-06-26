# Microsoft Clarity API 集成说明

## 概述

本项目已集成 Microsoft Clarity Data Export API，用于获取用户行为分析数据。Clarity 提供了用户会话录制、热点图、滚动深度等用户行为洞察数据。

## API 功能

### 支持的数据维度
- **操作系统 (OS)**: Windows, macOS, Android, iOS 等
- **浏览器 (Browser)**: Chrome, Safari, Firefox, Edge 等  
- **设备类型 (Device)**: Desktop, Mobile, Tablet
- **国家/地区 (Country/Region)**: 访问者的地理位置
- **流量来源 (Source)**: 直接访问、搜索引擎、社交媒体等
- **页面URL (URL)**: 具体的页面路径

### 可获取的指标
- 总会话数 (Total Sessions)
- 独立用户数 (Distinct Users)  
- 机器人会话数 (Bot Sessions)
- 平均页面/会话 (Pages Per Session)
- 滚动深度 (Scroll Depth)
- 参与时间 (Engagement Time)
- 错误点击、无效点击等行为指标

## 配置步骤

### 1. 获取 Clarity API Token

1. 登录 [Microsoft Clarity](https://clarity.microsoft.com/)
2. 进入你的项目设置页面
3. 导航到 **Settings** -> **Data Export** -> **Generate new API token**
4. 输入一个描述性的 token 名称（4-32字符，支持字母、数字、连字符、下划线、句号）
5. 复制生成的 token 并安全保存

### 2. 配置环境变量

在项目根目录的 `.env` 文件中添加：

```env
VITE_CLARITY_API_TOKEN=your_clarity_api_token_here
```

**注意**: 
- 只有项目管理员可以管理 API tokens
- Token 具有项目级别的权限
- 请妥善保管 token，不要在代码中硬编码

### 3. API 限制说明

- **请求限制**: 每个项目每日限制 10 次 API 请求
- **数据范围**: 仅支持最近 1-3 天的数据
- **时区**: API 返回的时间数据为 UTC 时区
- **维度限制**: 单次请求最多支持 3 个维度
- **响应限制**: 返回结果限制为 1000 行，不支持分页

### 4. 使用方式

集成完成后，在 Vertu Grand Analytics 仪表板中可以看到新的 "Microsoft Clarity 用户行为分析" 板块，包含：

- **实时统计概览**: 显示总用户数、会话数、机器人会话和平均页面访问
- **操作系统分布图**: 饼状图展示不同OS的用户分布
- **浏览器分布图**: 饼状图展示不同浏览器的使用情况  
- **设备类型分布图**: 显示桌面端、移动端、平板的访问比例
- **国家/地区分布图**: 展示访问者的地理分布
- **流量来源表格**: 详细的流量来源分析
- **热门页面表格**: 最受欢迎的页面 URL 统计

### 5. 故障排除

#### 常见错误码
- **401 Unauthorized**: API Token 无效或过期，请检查环境变量配置
- **403 Forbidden**: Token 权限不足，确保使用管理员生成的 token
- **400 Bad Request**: 请求参数无效，检查 API 调用参数
- **429 Too Many Requests**: 超过每日请求限制（10次）

#### 调试建议
1. 检查浏览器控制台是否有 API 错误信息
2. 确认 `.env` 文件中的 token 配置正确
3. 验证 Clarity 项目是否有数据（至少需要最近1-3天的访问数据）
4. 检查网络连接是否正常

## 数据更新

- 组件支持手动刷新数据
- 可选择查看最近 24、48 或 72 小时的数据
- 建议合理使用刷新功能，避免超出每日请求限制

## 安全考虑

- 永远不要在客户端代码中暴露 API Token
- 定期轮换 API Token（特别是当有用户离开项目时）
- 监控 API 使用情况，避免恶意调用
- 遵守数据保护法规（如 GDPR）处理用户数据

## 技术实现

### API 文件位置
- `src/api/clarity.js` - Clarity API 客户端
- `src/components/ClarityAnalysis.vue` - 主要分析组件

### 主要功能函数
- `fetchClarityTrafficByOS()` - 按操作系统获取数据
- `fetchClarityTrafficByBrowser()` - 按浏览器获取数据  
- `fetchClarityTrafficByDevice()` - 按设备类型获取数据
- `fetchClarityTrafficByCountry()` - 按国家获取数据
- `fetchClarityTrafficBySource()` - 按来源获取数据
- `fetchClarityTrafficByURL()` - 按页面URL获取数据

## 更多信息

- [Microsoft Clarity 官方文档](https://docs.microsoft.com/en-us/clarity/)
- [Clarity Data Export API 文档](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api)
- [Clarity 仪表板](https://clarity.microsoft.com/)

# Microsoft Clarity 配置指南

## 📋 概述
Microsoft Clarity 是一个免费的用户行为分析工具，提供热力图、会话录制和用户行为洞察。

## 🚀 1. 获取 Clarity API 密钥

### 步骤 1: 创建 Clarity 项目
1. 访问 [Microsoft Clarity](https://clarity.microsoft.com/)
2. 使用 Microsoft 账号登录
3. 点击 "Create new project"
4. 填写项目信息：
   - **Project name**: Vertu Grand Analytics
   - **Website URL**: https://www.vertu.com
   - **Project category**: E-commerce

### 步骤 2: 安装追踪代码 ⚠️ **重要**
**问题诊断：** 当前网站没有安装Clarity追踪代码，导致API无法获取数据。

#### 自动安装（推荐）
1. 在 Clarity 项目页面，找到 "Setup" 标签页
2. 选择 "Install manually"
3. 复制提供的追踪代码
4. 将代码添加到 `index.html` 的 `<head>` 部分

#### 手动安装
已在 `index.html` 中预置了追踪代码模板：
```html
<!-- Microsoft Clarity 追踪代码 -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "YOUR_CLARITY_PROJECT_ID");
</script>
```

**替换步骤：**
1. 找到你的 Clarity Project ID（在项目设置中）
2. 将 `YOUR_CLARITY_PROJECT_ID` 替换为真实的项目ID
3. 保存并重新部署网站

### 步骤 3: 获取 API 密钥
1. 在项目页面，点击右上角的 "Settings" (齿轮图标)
2. 选择 "Clarity API"
3. 点击 "Generate API token"
4. 复制生成的 API 密钥

## 🔧 2. 环境变量配置

在项目根目录创建或编辑 `.env` 文件：

```env
# Microsoft Clarity API 配置
VITE_CLARITY_API_TOKEN=your_clarity_api_token_here
```

## 📊 3. API 限制说明

### 当前限制
- **每日请求次数**: 10次
- **数据时间范围**: 1-3天前的数据
- **维度限制**: 最多3个维度组合
- **数据延迟**: 24-72小时

### 可用指标
- **流量指标**: 会话数、用户数、页面浏览量
- **行为指标**: 滚动深度、点击热力图、表单分析
- **设备信息**: 操作系统、浏览器、设备类型
- **地理位置**: 国家/地区、城市
- **来源信息**: 引荐来源、UTM参数

## 🔍 4. 数据验证

### 检查追踪是否正常工作
1. 部署网站后，等待2-4小时
2. 访问 Clarity 项目页面
3. 查看 "Dashboard" 是否显示数据
4. 在应用中测试数据获取

### 常见问题排查
1. **无数据显示**
   - 检查追踪代码是否正确安装
   - 确认 Project ID 是否正确
   - 等待数据处理完成（2-4小时）

2. **API 调用失败**
   - 验证 API Token 是否有效
   - 检查是否超出每日请求限制
   - 确认网络连接正常

## 🚨 5. 故障排除

### API 错误代码
- **401 Unauthorized**: API Token 无效或过期
- **403 Forbidden**: 权限不足，检查 Token 权限
- **400 Bad Request**: 请求参数错误
- **429 Too Many Requests**: 超出每日10次限制

### 调试步骤
1. 打开浏览器开发者工具
2. 查看 Console 标签页的错误信息
3. 检查 Network 标签页的API请求状态
4. 验证环境变量是否正确加载

## 📈 6. 高级配置

### 自定义事件追踪
```javascript
// 添加自定义事件
clarity("event", "purchase", {
  value: 1299.99,
  currency: "USD",
  item: "Vertu Signature S"
});
```

### 用户标识
```javascript
// 设置用户ID
clarity("identify", "user123", {
  userType: "premium",
  country: "CN"
});
```

## 🔒 7. 安全考虑

- **数据隐私**: Clarity 自动屏蔽敏感信息（密码、信用卡等）
- **GDPR 合规**: 配置隐私设置以符合数据保护法规
- **Token 安全**: 不要在客户端代码中暴露 API Token

## 📞 8. 支持

如遇问题，请：
1. 查看 [Clarity 官方文档](https://docs.microsoft.com/en-us/clarity/)
2. 检查本项目的控制台输出
3. 联系技术支持团队 