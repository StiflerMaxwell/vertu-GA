const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const BASE_URL = 'https://www.googleapis.com/alerts/v1/alerts'

export async function getAlerts() {
  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Get alerts error:', error)
    throw error
  }
}

export async function createAlert(query, options = {}) {
  const {
    frequency = 'immediate', // immediate, daily, weekly
    language = 'zh-CN',
    region = 'CN',
    deliveryTo = 'email'
  } = options

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        frequency,
        language,
        region,
        deliveryTo
      })
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Create alert error:', error)
    throw error
  }
}

export async function deleteAlert(alertId) {
  try {
    const response = await fetch(`${BASE_URL}/${alertId}?key=${API_KEY}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Delete alert error:', error)
    throw error
  }
}

export async function updateAlert(alertId, query, options = {}) {
  const {
    frequency,
    language,
    region,
    deliveryTo
  } = options

  try {
    const response = await fetch(`${BASE_URL}/${alertId}?key=${API_KEY}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        frequency,
        language,
        region,
        deliveryTo
      })
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Update alert error:', error)
    throw error
  }
} 