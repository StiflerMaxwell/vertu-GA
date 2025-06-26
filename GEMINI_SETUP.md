# Gemini AI 集成设置指南

本指南将帮助你设置和配置 Google Gemini AI API 集成，为 Vertu 分析仪表板提供 AI 驱动的数据洞察。

## 1. 获取 Gemini API 密钥

### 前往 Google AI Studio
1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 使用你的 Google 账户登录
3. 点击 "Get API Key" 按钮
4. 创建新的 API 密钥或使用现有的密钥
5. 复制生成的 API 密钥

### API 密钥权限设置
- 确保 API 密钥有权限访问 Gemini Pro 模型
- 检查配额限制（免费版本有使用限制）
- 如需高频使用，考虑升级到付费计划

## 2. 安装依赖

### 安装 Google GenerativeAI SDK
```bash
npm install @google/generative-ai
```

### 验证安装
```bash
npm list @google/generative-ai
```

## 3. 环境变量配置

### 创建或编辑 .env 文件
在项目根目录创建 `.env` 文件：

```env
# Gemini AI API 配置
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### 环境变量安全注意事项
- **重要**: 不要将 API 密钥提交到 Git 仓库
- 确保 `.env` 文件在 `.gitignore` 中
- 在生产环境中使用环境变量或密钥管理服务

## 4. 使用方法

### 基本 API 调用示例
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function analyzeData() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent("分析这些数据...");
  const response = await result.response;
  console.log(response.text());
}
```

### 在项目中的使用
```javascript
import geminiClient from './src/api/gemini.js';

// 网站健康分析
const healthAnalysis = await geminiClient.analyzeWebsiteHealth(data);

// 转化漏斗分析
const funnelAnalysis = await geminiClient.analyzeConversionFunnel(data);

// 流量渠道分析
const channelAnalysis = await geminiClient.analyzeTrafficChannels(data);

// 用户行为分析
const behaviorAnalysis = await geminiClient.analyzeUserBehavior(data);

// 综合战略分析
const insights = await geminiClient.generateComprehensiveInsights(allData);
```

## 5. API 功能详解

### 支持的分析维度

1. **网站健康分析** (`analyzeWebsiteHealth`)
   - 流量健康度评估 (0-100分)
   - 用户参与度评估 (0-100分)
   - 技术性能评估 (0-100分)
   - 关键问题识别
   - 具体行动建议

2. **转化漏斗分析** (`analyzeConversionFunnel`)
   - 转化漏斗效率分析
   - 销售表现评估
   - 弃单问题分析
   - 用户购买行为洞察
   - 针对性优化建议

3. **流量渠道分析** (`analyzeTrafficChannels`)
   - 渠道流量贡献分析
   - 渠道质量评估
   - 自然搜索表现
   - 付费渠道效果
   - 渠道优化策略

4. **用户行为分析** (`analyzeUserBehavior`)
   - 页面性能评估
   - 用户滚动行为分析
   - 产品页面表现
   - 用户路径分析
   - UX优化建议

5. **综合战略分析** (`generateComprehensiveInsights`)
   - 整体数字化成熟度评估
   - 核心商业机会识别
   - 风险预警与应对
   - 奢侈品牌特殊考量
   - 90天行动计划
   - 投资回报预测

## 6. API 限制和最佳实践

### 使用限制
- **免费版本**: 每分钟 60 次请求，每日有配额限制
- **响应时间**: 通常 2-10 秒，复杂分析可能更长
- **内容长度**: 输入和输出都有长度限制

### 最佳实践
1. **错误处理**: 始终包含适当的错误处理
2. **重试机制**: 对于临时失败实现重试逻辑
3. **缓存结果**: 对于相同数据避免重复请求
4. **异步处理**: 使用 async/await 处理长时间运行的分析

### 性能优化
```javascript
// 并行处理多个分析
const [health, funnel, channels, behavior] = await Promise.all([
  geminiClient.analyzeWebsiteHealth(data),
  geminiClient.analyzeConversionFunnel(data),
  geminiClient.analyzeTrafficChannels(data),
  geminiClient.analyzeUserBehavior(data)
]);
```

## 7. 错误处理和调试

### 常见错误类型
- **API_KEY_INVALID**: API 密钥无效或未配置
- **QUOTA_EXCEEDED**: 超出使用配额
- **MODEL_NOT_FOUND**: 模型名称错误
- **CONTENT_TOO_LONG**: 输入内容过长

### 调试技巧
1. 检查浏览器控制台的错误信息
2. 验证 API 密钥是否正确配置
3. 确认网络连接正常
4. 查看 API 使用配额状态

### 错误处理示例
```javascript
try {
  const analysis = await geminiClient.analyzeWebsiteHealth(data);
  console.log(analysis);
} catch (error) {
  if (error.message.includes('API_KEY_INVALID')) {
    console.error('请检查 Gemini API 密钥配置');
  } else if (error.message.includes('QUOTA_EXCEEDED')) {
    console.error('API 配额已用完，请稍后重试');
  } else {
    console.error('分析失败:', error.message);
  }
}
```

## 8. 安全考虑

### API 密钥安全
- 不要在客户端代码中硬编码 API 密钥
- 使用环境变量管理敏感信息
- 定期轮换 API 密钥
- 监控 API 使用情况

### 数据隐私
- Gemini AI 可能会记录请求用于改进服务
- 避免发送敏感的用户个人信息
- 遵守数据保护法规 (GDPR, CCPA 等)

### 访问控制
- 限制 API 密钥的使用范围
- 实施请求频率限制
- 监控异常使用模式

## 9. 生产环境部署

### 环境配置
```bash
# 生产环境
VITE_GEMINI_API_KEY=prod_api_key_here

# 开发环境
VITE_GEMINI_API_KEY=dev_api_key_here
```

### 监控和日志
- 记录 API 请求和响应时间
- 监控错误率和成功率
- 设置告警阈值

### 缓存策略
```javascript
// 实现简单的内存缓存
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟

async function getCachedAnalysis(key, analysisFunction, data) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const result = await analysisFunction(data);
  cache.set(key, { data: result, timestamp: Date.now() });
  return result;
}
```

## 10. 故障排除

### 检查清单
- [ ] API 密钥是否正确配置在 .env 文件中
- [ ] 是否安装了 @google/generative-ai 包
- [ ] 网络连接是否正常
- [ ] 是否超出 API 配额限制
- [ ] 输入数据格式是否正确

### 测试连接
```javascript
// 测试 Gemini API 连接
async function testGeminiConnection() {
  try {
    const result = await geminiClient.generateContent("测试连接");
    console.log("Gemini API 连接成功:", result);
    return true;
  } catch (error) {
    console.error("Gemini API 连接失败:", error);
    return false;
  }
}
```

## 支持和帮助

如果遇到问题：
1. 查看 [Google AI Studio 文档](https://ai.google.dev/docs)
2. 检查 [API 状态页面](https://status.cloud.google.com/)
3. 参考项目中的示例代码
4. 联系技术支持团队

---

**注意**: 本集成专为 Vertu 奢侈品牌的数据分析需求定制，所有 AI 分析都考虑了高端客户群体的特征和行为模式。 