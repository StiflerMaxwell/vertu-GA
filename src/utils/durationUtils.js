/**
 * 统一的时长格式化工具函数
 * 解决项目中页面停留时长显示不一致的问题
 */

/**
 * 格式化毫秒为时长字符串 - GA4专用函数
 * @param {number} milliseconds - 毫秒数（来自GA4 userEngagementDuration）
 * @param {object} options - 格式化选项
 * @returns {string} 格式化后的时长字符串
 */
export function formatDurationFromMilliseconds(milliseconds, options = {}) {
  // 将毫秒转换为秒
  const seconds = Math.floor(Number(milliseconds) / 1000)
  return formatDuration(seconds, options)
}

/**
 * 计算并格式化平均停留时长（处理GA4毫秒数据）
 * @param {number} userEngagementDurationMs - 用户参与时长（毫秒）
 * @param {number} sessions - 会话数
 * @param {object} options - 格式化选项
 * @returns {string} 格式化后的平均时长字符串
 */
export function formatAverageEngagementTime(userEngagementDurationMs, sessions, options = {}) {
  if (!userEngagementDurationMs || !sessions || sessions === 0) {
    return '0秒'
  }
  
  // 先转换为秒，再计算平均值
  const totalSeconds = Math.floor(Number(userEngagementDurationMs) / 1000)
  const averageSeconds = Math.floor(totalSeconds / sessions)
  
  return formatDuration(averageSeconds, options)
}

/**
 * 格式化时长 - 主要格式化函数
 * @param {number} seconds - 秒数
 * @param {object} options - 格式化选项
 * @returns {string} 格式化后的时长字符串
 */
export function formatDuration(seconds, options = {}) {
  const {
    showSeconds = true,      // 是否显示秒数
    showHours = true,        // 是否显示小时
    compact = false,         // 紧凑模式（使用简写）
    precision = 0            // 小数精度
  } = options

  if (!seconds && seconds !== 0) return '0秒'
  
  const totalSeconds = Math.floor(Number(seconds))
  if (totalSeconds <= 0) return '0秒'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  let result = ''

  if (showHours && hours > 0) {
    if (compact) {
      result += `${hours}h`
    } else {
      result += `${hours}小时`
    }
  }

  if (minutes > 0 || hours > 0) {
    if (compact) {
      result += hours > 0 ? `${minutes}m` : `${minutes}m`
    } else {
      result += `${minutes}分`
    }
  }

  if (showSeconds && (remainingSeconds > 0 || (!hours && !minutes))) {
    if (compact) {
      result += `${remainingSeconds}s`
    } else {
      result += `${remainingSeconds}秒`
    }
  }

  return result || '0秒'
}

/**
 * 格式化时长为分钟（用于图表显示）
 * @param {number} seconds - 秒数
 * @param {number} precision - 小数精度，默认1位
 * @returns {number} 分钟数
 */
export function formatDurationToMinutes(seconds, precision = 1) {
  if (!seconds && seconds !== 0) return 0
  const minutes = Number(seconds) / 60
  return Number(minutes.toFixed(precision))
}

/**
 * 格式化时长为简洁显示（用于表格）
 * @param {number} seconds - 秒数
 * @returns {string} 简洁格式的时长
 */
export function formatDurationCompact(seconds) {
  return formatDuration(seconds, { compact: false, showSeconds: true })
}

/**
 * 格式化时长为超简洁显示（用于小卡片）
 * @param {number} seconds - 秒数
 * @returns {string} 超简洁格式的时长
 */
export function formatDurationMini(seconds) {
  if (!seconds && seconds !== 0) return '0秒'
  
  const totalSeconds = Math.floor(Number(seconds))
  if (totalSeconds <= 0) return '0秒'

  const minutes = Math.floor(totalSeconds / 60)
  
  if (minutes < 1) {
    return `${totalSeconds}秒`
  } else if (minutes < 60) {
    const remainingSeconds = totalSeconds % 60
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分` : `${hours}小时`
  }
}

/**
 * 验证时长数据是否异常
 * @param {number} seconds - 秒数
 * @returns {object} 验证结果
 */
export function validateDuration(seconds) {
  const result = {
    isValid: true,
    isAbnormal: false,
    message: ''
  }

  if (!seconds && seconds !== 0) {
    result.isValid = false
    result.message = '时长数据为空'
    return result
  }

  const totalSeconds = Number(seconds)
  
  if (totalSeconds < 0) {
    result.isValid = false
    result.message = '时长不能为负数'
  } else if (totalSeconds > 86400) { // 大于24小时
    result.isAbnormal = true
    result.message = `时长异常大: ${Math.round(totalSeconds/86400)}天`
  } else if (totalSeconds > 7200) { // 大于2小时，标记为可疑
    result.isAbnormal = true
    result.message = '时长较长，请检查数据准确性'
  }

  return result
}

/**
 * GA4 指标标准化
 * 统一使用 averageEngagementTime，这个更接近传统的页面停留时长
 */
export const DURATION_METRICS = {
  // 推荐使用的时长指标
  PRIMARY: 'userEngagementDuration',     // 用户活跃参与时长（总时长）
  ALTERNATIVE: 'averageEngagementTime', // 平均参与时间（更接近传统停留时长）
  
  // 页面级别的时长指标
  PAGE_DURATION: 'userEngagementDuration'
}

/**
 * 获取标准化的时长指标配置
 * @param {string} context - 使用场景：'session'(会话级) | 'page'(页面级)
 * @returns {object} GA4 指标配置
 */
export function getDurationMetricConfig(context = 'session') {
  if (context === 'page') {
    return { name: DURATION_METRICS.PAGE_DURATION }
  }
  // 对于会话级或用户级平均时长，我们请求原始的 userEngagementDuration，然后由调用方计算平均值
  return { name: DURATION_METRICS.PRIMARY }
}