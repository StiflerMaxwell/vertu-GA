const HISTORY_KEY = 'lighthouse_history'

export function getLighthouseHistory(device = 'desktop') {
  try {
    const history = JSON.parse(localStorage.getItem('lighthouseHistory') || '{}')
    return history[device] || []
  } catch (error) {
    console.error('Error getting lighthouse history:', error)
    return []
  }
}

export function saveLighthouseResult(result) {
  try {
    const history = JSON.parse(localStorage.getItem('lighthouseHistory') || '{}')
    const device = result.device || 'desktop'
    
    if (!history[device]) {
      history[device] = []
    }
    
    history[device] = [
      {
        ...result,
        timestamp: new Date().toISOString()
      },
      ...history[device].slice(0, 9) // 保留最近10条记录
    ]
    
    localStorage.setItem('lighthouseHistory', JSON.stringify(history))
    return history[device]
  } catch (error) {
    console.error('Error saving lighthouse result:', error)
    return []
  }
} 