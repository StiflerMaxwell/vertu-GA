import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

class GeminiClient {
  constructor() {
    this.apiKey = GEMINI_API_KEY;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  async generateContent(prompt) {
    try {
      if (!this.genAI) {
        console.warn('Gemini API Key not configured');
        return null;
      }

      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  // 生成网站健康分析
  async analyzeWebsiteHealth(data) {
    const prompt = `
作为一名资深的数字营销和网站分析专家，请基于以下数据对网站整体健康状况进行深度分析：

## 数据概览
**GA4 数据：**
- 总用户数: ${data.ga4?.totalUsers || 0}
- 跳出率: ${data.ga4?.bounceRate || 0}%
- 平均互动时长: ${data.ga4?.avgEngagementTime || 0}秒
- 平均事件数/会话: ${data.ga4?.eventsPerSession || 0}
- 平均页面浏览数/会话: ${data.ga4?.pageViewsPerSession || 0}

**Clarity 数据：**
- 平均滚动深度: ${data.clarity?.avgScrollDepth || 0}%
- 总会话数: ${data.clarity?.totalSessions || 0}

**性能数据：**
- 页面加载速度: ${data.performance?.loadTime || 0}毫秒
- Core Web Vitals 评分: ${data.performance?.coreWebVitals || 0}

**Live Chat 数据：**
- 实时在线人数: ${data.liveChat?.onlineUsers || 0}

请从以下维度进行分析：

1. **流量健康度评估** (0-100分)
   - 分析用户增长趋势和流量稳定性
   - 评估用户质量指标

2. **用户参与度评估** (0-100分)
   - 跳出率、停留时间、滚动深度综合分析
   - 用户互动行为评估

3. **技术性能评估** (0-100分)
   - 页面加载速度对用户体验的影响
   - Core Web Vitals 各项指标解读

4. **关键问题识别**
   - 指出当前最需要关注的3个问题
   - 分析各指标间的关联性

5. **具体行动建议**
   - 提供3-5个可立即执行的优化建议
   - 按优先级排序，说明预期效果

请用中文回答，结构化输出，每个维度给出具体的分数和详细的分析说明。
    `;

    return await this.generateContent(prompt);
  }

  // 生成转化漏斗分析
  async analyzeConversionFunnel(data) {
    const prompt = `
作为电商转化优化专家，请基于以下数据分析转化漏斗表现和销售情况：

## 数据概览
**GA4 转化数据：**
- 总用户数: ${data.ga4?.totalUsers || 0}
- 加购事件数: ${data.ga4?.addToCartEvents || 0}
- 结账事件数: ${data.ga4?.checkoutEvents || 0}
- 购买事件数: ${data.ga4?.purchaseEvents || 0}

**WooCommerce 订单数据：**
- 总订单数: ${data.woocommerce?.totalOrders || 0}
- 已完成订单: ${data.woocommerce?.completedOrders || 0}
- 处理中订单: ${data.woocommerce?.processingOrders || 0}
- 待付款订单: ${data.woocommerce?.pendingOrders || 0}
- 取消订单: ${data.woocommerce?.cancelledOrders || 0}
- 总收入: $${data.woocommerce?.totalRevenue || 0}
- 平均订单价值: $${data.woocommerce?.avgOrderValue || 0}
- 弃单率: ${data.woocommerce?.abandonedCartRate || 0}%

请进行以下分析：

1. **转化漏斗效率分析**
   - 计算各环节转化率：浏览→加购→结账→购买
   - 识别转化瓶颈和流失点
   - 对比行业标准（奢侈品电商）

2. **销售表现评估**
   - 订单数量和金额趋势分析
   - 平均订单价值是否达到目标
   - 订单状态分布的健康度

3. **弃单问题分析**
   - 弃单率水平评估
   - 可能的弃单原因分析
   - 弃单挽回策略建议

4. **用户购买行为洞察**
   - 用户从浏览到购买的决策路径
   - 高价值客户的行为特征
   - 购买决策的影响因素

5. **优化建议**
   - 针对最薄弱环节的3个具体优化方案
   - 预期提升的转化率百分比
   - 实施难度和资源需求评估

请用中文回答，包含具体的数据计算和行业对比。
    `;

    return await this.generateContent(prompt);
  }

  // 生成流量渠道分析
  async analyzeTrafficChannels(data) {
    const prompt = `
作为数字营销策略专家，请基于以下多渠道数据进行流量分析：

## 数据概览
**GA4 渠道数据：**
${JSON.stringify(data.ga4?.channelData || {}, null, 2)}

**GSC 自然搜索数据：**
- 总点击数: ${data.gsc?.totalClicks || 0}
- 总展示数: ${data.gsc?.totalImpressions || 0}
- 平均CTR: ${data.gsc?.avgCTR || 0}%
- 平均排名: ${data.gsc?.avgPosition || 0}

**各渠道订单贡献：**
${JSON.stringify(data.channelOrders || {}, null, 2)}

请进行以下分析：

1. **渠道流量贡献分析**
   - 各渠道流量占比和增长趋势
   - 流量来源多样性评估
   - 对核心渠道的依赖度风险

2. **渠道质量评估**
   - 各渠道的用户参与度对比
   - 跳出率、停留时间、转化率分析
   - ROI最高的渠道识别

3. **自然搜索表现**
   - SEO流量趋势和关键词表现
   - 重要关键词排名变化
   - 搜索可见性提升空间

4. **付费渠道效果**
   - 付费流量的成本效益
   - 各平台ROI对比
   - 预算分配优化建议

5. **渠道优化策略**
   - 低表现渠道的改进方案
   - 高价值渠道的扩大策略
   - 新渠道探索建议

请用中文回答，重点关注Vertu奢侈品牌的特殊性和目标客群特征。
    `;

    return await this.generateContent(prompt);
  }

  // 生成用户行为和页面分析
  async analyzeUserBehavior(data) {
    const prompt = `
作为用户体验和产品分析专家，请基于以下数据分析用户行为和页面表现：

## 数据概览
**GA4 页面数据：**
${JSON.stringify(data.ga4?.pageData || {}, null, 2)}

**Clarity 用户行为数据：**
- 平均滚动深度: ${data.clarity?.avgScrollDepth || 0}%
- 热点区域点击数据: ${JSON.stringify(data.clarity?.heatmapData || {}, null, 2)}
- 用户会话回放数量: ${data.clarity?.sessionRecordings || 0}

**产品表现数据：**
${JSON.stringify(data.products || {}, null, 2)}

**用户路径数据：**
${JSON.stringify(data.userJourney || {}, null, 2)}

请进行以下分析：

1. **页面性能评估**
   - 各页面浏览量、停留时间、跳出率分析
   - 关键页面的转化表现
   - 页面流失点识别

2. **用户滚动行为分析**
   - 滚动深度对内容消费的指示
   - 关键内容区域的可见性
   - 页面布局优化建议

3. **产品页面表现**
   - 热销产品的页面表现特征
   - 产品详情页的用户行为模式
   - 产品展示优化空间

4. **用户路径分析**
   - 用户在网站内的导航模式
   - 转化路径的效率评估
   - 用户流失的关键节点

5. **UX优化建议**
   - 基于用户行为数据的界面改进
   - 内容布局和导航优化
   - 移动端用户体验提升

请用中文回答，重点关注奢侈品客户的浏览习惯和决策行为特点。
    `;

    return await this.generateContent(prompt);
  }

  // 生成数据诊断报告（当数据质量有严重问题时）
  async generateDataDiagnosisReport(data) {
    const validationReport = data.dataQuality?.validationReport || {}
    
    const prompt = `
作为数字分析技术专家，基于以下数据质量检测结果，提供专业的数据追踪系统诊断和修复建议：

## 数据质量检测结果

**整体健康状况：** ${validationReport.overallHealth}

**GA4 问题：**
${validationReport.ga4Issues?.map(issue => `- ${issue}`).join('\n') || '无问题'}

**Clarity 问题：**
${validationReport.clarityIssues?.map(issue => `- ${issue}`).join('\n') || '无问题'}

**WooCommerce 问题：**
${validationReport.wooIssues?.map(issue => `- ${issue}`).join('\n') || '无问题'}

**GSC 问题：**
${validationReport.gscIssues?.map(issue => `- ${issue}`).join('\n') || '无问题'}

**严重问题列表：**
${validationReport.criticalIssues?.map(issue => `- ${issue}`).join('\n') || '无严重问题'}

**警告问题列表：**
${validationReport.warningIssues?.map(issue => `- ${issue}`).join('\n') || '无警告问题'}

**原始数据概览：**
- GA4总用户数: ${data.summary?.totalUsers || 0}
- GA4平均参与时长: ${data.summary?.avgEngagementTime || 0}秒
- GA4页面浏览数: ${data.summary?.pageViews || 0}
- Clarity用户数: ${data.summary?.clarityTotalUsers || 0}
- Clarity滚动深度: ${data.summary?.clarityAvgScrollDepth || 0}%

请提供以下内容：

## 1. 问题根本原因分析
深入分析检测到的每个问题的可能技术原因

## 2. 数据可信度评估
基于当前数据状态，评估哪些指标可信，哪些不可信

## 3. 紧急修复行动清单
按优先级排序的具体技术修复步骤

## 4. 验证测试方案
修复后如何验证数据追踪是否正常工作

## 5. 预防措施建议
如何避免类似问题再次发生

请用中文回答，提供可操作的技术建议。重点关注GA4和Clarity的配置问题。
    `;

    return await this.generateContent(prompt);
  }

  // 生成综合性策略分析和建议
  async generateComprehensiveInsights(allData) {
    const prompt = `
作为资深的数字化战略顾问，请基于以下综合数据为Vertu奢侈品牌制定全面的数字化营销策略：

## 综合数据概览
**网站健康指标：**
${JSON.stringify(allData.websiteHealth || {}, null, 2)}

**转化漏斗数据：**
${JSON.stringify(allData.conversionFunnel || {}, null, 2)}

**流量渠道表现：**
${JSON.stringify(allData.trafficChannels || {}, null, 2)}

**用户行为洞察：**
${JSON.stringify(allData.userBehavior || {}, null, 2)}

**竞争环境分析：**
${JSON.stringify(allData.competitive || {}, null, 2)}

请提供以下战略级分析：

1. **整体数字化成熟度评估** (0-100分)
   - 技术基础设施完善度
   - 数据驱动决策能力
   - 用户体验优化水平
   - 营销自动化程度

2. **核心商业机会识别**
   - 最具增长潜力的3个领域
   - 快速见效的优化机会
   - 长期战略投资方向

3. **风险预警与应对**
   - 当前面临的主要风险
   - 潜在的市场威胁
   - 风险缓解策略

4. **奢侈品牌数字化特殊考量**
   - 品牌调性与数字化体验的平衡
   - 高净值客户的数字化偏好
   - 线上线下融合策略

5. **90天行动计划**
   - 第一个月：紧急优化事项
   - 第二个月：核心功能完善
   - 第三个月：策略性提升
   - 每个阶段的成功指标

6. **投资回报预测**
   - 各项优化措施的预期ROI
   - 资源投入与收益时间线
   - 关键性能指标的目标设定

请用中文回答，提供具体可执行的策略建议，重点考虑Vertu品牌的高端定位和目标客群特征。
    `;

    return await this.generateContent(prompt);
  }
}

// 创建单例实例
const geminiClient = new GeminiClient();

export { geminiClient };
export default geminiClient; 