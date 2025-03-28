import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import { getProductsByCategory, createProduct, updateProduct, deleteProduct } from '../api/woocommerce'
import { ElMessage } from 'element-plus'

// WooCommerce store for managing products
export const useWooCommerceStore = defineStore('wooCommerce', () => {
  // State
  const products = ref([])
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalItems = ref(0)
  const totalPages = ref(0)
  
  // Constants
  const PAYMENT_LINK_CATEGORY_ID = 359
  
  // Load products from the API
  const loadProducts = async (page = 1, perPage = 20) => {
    loading.value = true
    try {
      const response = await getProductsByCategory(
        PAYMENT_LINK_CATEGORY_ID, 
        page, 
        perPage
      )
      products.value = response.products
      totalItems.value = response.totalItems
      totalPages.value = response.totalPages
      currentPage.value = page
      pageSize.value = perPage
      return response
    } catch (error) {
      console.error('Failed to load products:', error)
      ElMessage.error('Failed to load products. Please try again.')
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // Create a new product
  const addProduct = async (productData) => {
    loading.value = true
    try {
      // Ensure the product is assigned to the payment-link category
      const data = {
        ...productData,
        categories: [
          {
            id: PAYMENT_LINK_CATEGORY_ID
          }
        ]
      }
      
      const result = await createProduct(data)
      ElMessage.success('Product created successfully')
      await loadProducts(currentPage.value, pageSize.value)
      return result
    } catch (error) {
      console.error('Failed to create product:', error)
      ElMessage.error('Failed to create product. Please try again.')
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // Update an existing product
  const editProduct = async (productId, productData) => {
    loading.value = true
    try {
      const result = await updateProduct(productId, productData)
      ElMessage.success('Product updated successfully')
      await loadProducts(currentPage.value, pageSize.value)
      return result
    } catch (error) {
      console.error('Failed to update product:', error)
      ElMessage.error('Failed to update product. Please try again.')
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // Delete a product
  const removeProduct = async (productId) => {
    loading.value = true
    try {
      const result = await deleteProduct(productId)
      ElMessage.success('Product deleted successfully')
      await loadProducts(currentPage.value, pageSize.value)
      return result
    } catch (error) {
      console.error('Failed to delete product:', error)
      ElMessage.error('Failed to delete product. Please try again.')
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // Update page size and reload
  const setPageSize = async (size) => {
    pageSize.value = size
    currentPage.value = 1 // Reset to first page
    await loadProducts(1, size)
  }
  
  // Change page and reload
  const setCurrentPage = async (page) => {
    await loadProducts(page, pageSize.value)
  }
  
  return {
    // State
    products,
    loading,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    
    // Actions
    loadProducts,
    addProduct,
    editProduct,
    removeProduct,
    setPageSize,
    setCurrentPage
  }
}) 