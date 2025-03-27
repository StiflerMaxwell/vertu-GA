import { createApp } from 'vue'
import './style.css'
import './styles/reset.css'
import './styles/theme.css'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import * as echarts from 'echarts'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 添加图表 resize 指令
app.directive('chart-resize', {
  mounted(el, binding) {
    // 存储图表实例
    el._chartInstance = binding.value
    
    // 创建带有防抖的 resize 处理函数
    const resizeHandler = debounce(() => {
      if (el._chartInstance && typeof el._chartInstance.resize === 'function') {
        el._chartInstance.resize()
      }
    }, 200)
    
    el._resizeHandler = resizeHandler
    
    // 添加窗口 resize 事件监听
    window.addEventListener('resize', resizeHandler)
    
    // 监听 DOM 尺寸变化
    if (typeof ResizeObserver !== 'undefined') {
      el._resizeObserver = new ResizeObserver(() => {
        resizeHandler()
      })
      el._resizeObserver.observe(el)
    }
  },
  updated(el, binding) {
    // 更新图表实例
    el._chartInstance = binding.value
  },
  unmounted(el) {
    // 移除事件监听器
    window.removeEventListener('resize', el._resizeHandler)
    
    // 移除 ResizeObserver
    if (el._resizeObserver) {
      el._resizeObserver.disconnect()
    }
    
    // 清除引用
    delete el._chartInstance
    delete el._resizeHandler
    delete el._resizeObserver
  }
})

// 防抖函数
function debounce(fn, delay) {
  let timer = null
  return function() {
    const context = this
    const args = arguments
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(context, args)
    }, delay)
  }
}

app.use(ElementPlus)
app.config.globalProperties.$echarts = echarts
app.mount('#app')
