import axios from 'axios'

// WooCommerce API configuration
const apiUrl = import.meta.env.VITE_WOO_API_URL
const consumerKey = import.meta.env.VITE_WOO_CONSUMER_KEY
const consumerSecret = import.meta.env.VITE_WOO_CONSUMER_SECRET

// Create axios instance for WooCommerce API
const wooApi = axios.create({
  baseURL: apiUrl,
  auth: {
    username: consumerKey,
    password: consumerSecret
  }
})

// Error handling
wooApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('WooCommerce API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Get all products from a specific category
export const getProductsByCategory = async (categoryId, page = 1, perPage = 20) => {
  try {
    const response = await wooApi.get('/products', {
      params: {
        category: categoryId,
        page,
        per_page: perPage
      }
    })
    return { 
      products: response.data,
      totalItems: parseInt(response.headers['x-wp-total'] || 0),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || 0)
    }
  } catch (error) {
    throw error
  }
}

// Get a single product
export const getProduct = async (productId) => {
  try {
    const response = await wooApi.get(`/products/${productId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Create a new product
export const createProduct = async (productData) => {
  try {
    // 确保产品只添加categories一次，避免覆盖传入的categories
    const data = { ...productData }
    
    // 如果没有categories，则添加默认分类
    if (!data.categories || data.categories.length === 0) {
      data.categories = [
        {
          id: 359 // payment-link category ID
        }
      ]
    }
    
    const response = await wooApi.post('/products', data)
    return response.data
  } catch (error) {
    throw error
  }
}

// Update a product
export const updateProduct = async (productId, productData) => {
  try {
    const response = await wooApi.put(`/products/${productId}`, productData)
    return response.data
  } catch (error) {
    throw error
  }
}

// Delete a product
export const deleteProduct = async (productId, force = true) => {
  try {
    const response = await wooApi.delete(`/products/${productId}`, {
      params: { force } // Permanently delete instead of moving to trash
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// Get all product categories
export const getCategories = async () => {
  try {
    const response = await wooApi.get('/products/categories')
    return response.data
  } catch (error) {
    throw error
  }
} 