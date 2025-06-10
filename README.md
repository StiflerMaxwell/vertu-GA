# Vertu Grand Analytics - 综合数据分析看板

[![Vue 3](https://img.shields.io/badge/Vue-3.5.13-4FC08D.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1.0-646CFF.svg)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.9.3-409EFF.svg)](https://element-plus.org/)

## 📊 项目简介

Vertu Grand Analytics 是一个基于 Vue 3 构建的现代化数据分析看板，专为 Vertu 品牌打造的综合性 Web 分析平台。该平台集成了多个数据源，提供实时流量监控、电商数据分析、SEO 优化建议等功能，帮助业务团队全面了解网站性能和用户行为。

## ✨ 核心功能

### 📈 实时数据监控
- **实时流量监控**：实时展示网站访问量、活跃用户数等关键指标
- **实时指标更新**：自动刷新数据，提供最新的业务洞察
- **性能指标追踪**：监控页面加载速度、响应时间等性能参数

### 📊 数据分析模块
- **核心指标仪表板**：展示关键业务指标，包括用户数、页面浏览量、转化率等
- **趋势分析图表**：可视化数据趋势，支持多维度对比分析
- **访问来源分析**：详细分析流量来源，包括直接访问、搜索引擎、社交媒体等
- **地理分布分析**：展示用户地理位置分布和区域性能表现

### 🛒 电子商务分析
- **电商数据集成**：与 WooCommerce 集成，分析订单、销售、产品性能
- **支付链接产品分析**：追踪支付链接的转化效果
- **收入趋势分析**：监控销售收入变化趋势
- **产品表现评估**：分析畅销产品和库存状况

### 🔍 SEO 与搜索优化
- **Google Search Console 集成**：获取搜索关键词、点击率、排名数据
- **搜索关键词分析**：识别高价值关键词和优化机会
- **页面性能评估**：通过 Lighthouse 评估页面 SEO 表现
- **优化建议生成**：基于数据分析提供具体的 SEO 优化建议

### 🚨 监控与警报
- **Google Alerts 集成**：监控品牌提及和相关新闻
- **性能历史追踪**：长期跟踪网站性能变化
- **异常检测**：识别数据异常波动并发出警报

## 🛠 技术栈

### 前端框架
- **Vue 3.5.13** - 渐进式 JavaScript 框架
- **Vite 6.1.0** - 现代化构建工具
- **Element Plus 2.9.3** - Vue 3 组件库

### 数据可视化
- **ECharts 5.6.0** - 专业的数据可视化库
- **Google Maps API** - 地理数据展示

### 数据集成
- **Google Analytics 4 API** - 网站分析数据
- **Google Search Console API** - 搜索性能数据  
- **WooCommerce API** - 电商数据
- **Lighthouse API** - 网站性能评估
- **Firebase** - 数据存储和配置管理

### 状态管理与工具
- **Pinia 3.0.1** - Vue 状态管理
- **Axios 1.7.9** - HTTP 客户端
- **Day.js 1.11.13** - 日期处理库
- **XLSX 0.18.5** - Excel 文件处理

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env` 文件并配置必要的 API 密钥：
```env
VITE_GA4_PROPERTY_ID=你的GA4属性ID
VITE_GA4_CLIENT_EMAIL=服务账号邮箱
VITE_GA4_PRIVATE_KEY=服务账号私钥
VITE_GSC_SITE_URL=网站URL
VITE_GSC_CLIENT_EMAIL=GSC服务账号邮箱
VITE_GSC_PRIVATE_KEY=GSC服务账号私钥
```

### 启动开发服务器
```bash
npm run dev
```
访问 `http://localhost:5173` 查看应用

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 📱 功能特性

### 响应式设计
- 完全响应式布局，支持桌面端和移动端
- 自适应图表尺寸调整
- 触摸友好的交互设计

### 主题系统
- 支持明暗主题切换
- 自定义主题色彩
- 一致的视觉设计语言

### 交互体验
- 可折叠的内容区块
- 实时数据自动刷新
- 平滑的动画过渡效果
- 智能的加载状态提示

### 数据导出
- 支持 Excel 格式数据导出
- 自定义日期范围选择
- 批量数据处理能力

## 🔧 项目结构

```
src/
├── api/           # API 接口定义
├── components/    # Vue 组件
├── firebase/      # Firebase 服务
├── store/         # Pinia 状态管理
├── styles/        # 样式文件
├── tools/         # 工具函数
└── utils/         # 通用工具
```

## 📊 数据源集成

### Google Analytics 4
- 实时用户数据
- 页面浏览统计
- 用户行为分析
- 转化追踪

### Google Search Console
- 搜索关键词数据
- 点击率统计
- 搜索排名监控
- 页面索引状态

### WooCommerce
- 订单数据分析
- 产品销售统计
- 客户行为追踪
- 库存管理信息

### Lighthouse
- 页面性能评分
- SEO 评估结果
- 可访问性检查
- 最佳实践建议

## 🎯 使用场景

- **营销团队**：监控推广效果，优化投放策略
- **产品团队**：分析用户行为，改进产品体验  
- **SEO 团队**：优化搜索排名，提升自然流量
- **运营团队**：跟踪业务指标，制定运营策略
- **管理层**：全面了解业务状况，做出数据驱动的决策

## 🤝 贡献指南

欢迎提交 Issues 和 Pull Requests 来改进项目。

## 📄 许可证

本项目采用私有许可证，仅供 Vertu 内部使用。

---

**Vertu Grand Analytics** - 让数据驱动业务增长 🚀 