/**
 * 获取默认的日期范围（最近7天）
 * @returns {{startDate: string, endDate: string}} 返回符合GSC要求的开始日期和结束日期
 */
export function getDefaultDateRange() {
  const end = new Date()
  // GSC 数据通常有 2-3 天的延迟，所以我们从 3 天前开始算
  end.setDate(end.getDate() - 3)
  
  const start = new Date(end)
  // 设置为7天前
  start.setDate(end.getDate() - 7)

  // 转换为 YYYY-MM-DD 格式
  const endDate = end.toISOString().split('T')[0]
  const startDate = start.toISOString().split('T')[0]

  return {
    startDate,
    endDate
  }
} 