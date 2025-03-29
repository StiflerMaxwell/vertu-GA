<template>
  <el-card class="payment-link-products" :class="{ 'is-dark': isDark }">
    <template #header>
      <div class="card-header">
        <h3 class="title">Payment Link Products</h3>
        <div class="actions">
          <el-button type="primary" @click="openCreateModal" :disabled="!isApiConfigured">
            <el-icon><Plus /></el-icon> Add Product
          </el-button>
        </div>
      </div>
    </template>

    <div v-if="!isApiConfigured" class="api-not-configured">
      <el-alert
        title="WooCommerce API Not Configured"
        type="warning"
        description="Please set the WooCommerce API credentials in your .env file."
        show-icon
        :closable="false"
      >
        <template #default>
          <p class="mt-3">To configure the WooCommerce API, add the following to your .env file:</p>
          <pre class="code-block">
VITE_WOO_API_URL=https://your-site.com/wp-json/wc/v3
VITE_WOO_CONSUMER_KEY=your_consumer_key
VITE_WOO_CONSUMER_SECRET=your_consumer_secret</pre>
        </template>
      </el-alert>
    </div>

    <div class="main-content" v-else v-loading="loading">
      <!-- Product Table -->
      <el-table 
        :data="products" 
        border 
        stripe 
        highlight-current-row
        @row-click="handleRowClick"
        empty-text="No products found in the payment-link category"
        class="product-table"
      >
        <el-table-column label="ID" prop="id" width="80" :class-name="'is-hidden-sm-and-down'" />
        <el-table-column label="Image" width="100">
          <template #default="{ row }">
            <el-image 
              v-if="row.images && row.images.length > 0" 
              :src="row.images[0].src" 
              :preview-src-list="[row.images[0].src]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px;"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Name" prop="name" min-width="120">
          <template #default="{ row }">
            <div class="product-name">
              <span v-html="row.name"></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Price" width="120">
          <template #default="{ row }">
            <span>${{ formatPrice(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Status" width="120" :class-name="'is-hidden-sm-and-down'">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click.stop="handleEdit(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="danger" size="small" @click.stop="confirmDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :layout="screenWidth <= 768 ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :total="totalItems"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- Product Edit Modal -->
    <el-dialog 
      v-model="editModalVisible" 
      :title="isCreating ? 'Create New Product' : 'Edit Product'"
      width="90%"
      :max-width="screenWidth < 768 ? '95%' : '500px'"
      destroy-on-close
      class="product-dialog"
      top="8vh"
      append-to-body
    >
      <el-form 
        ref="productForm" 
        :model="editingProduct" 
        :rules="productRules" 
        label-width="120px"
        class="product-form"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="editingProduct.name" placeholder="Product Name" />
        </el-form-item>
        
        <el-form-item label="Price ($)" prop="price">
          <el-input-number 
            v-model="editingProduct.price" 
            :precision="2" 
            :step="0.01" 
            :min="0" 
            controls-position="right"
            style="width: 100%;"
          />
        </el-form-item>

        <!-- Display-only fields -->
        <el-form-item label="Status" v-if="!isCreating">
          <el-tag :type="getStatusType(editingProduct.status)">
            {{ editingProduct.status }}
          </el-tag>
        </el-form-item>

        <el-form-item label="Created" v-if="!isCreating">
          <span>{{ formatDate(editingProduct.date_created) }}</span>
        </el-form-item>

        <el-form-item label="Last Updated" v-if="!isCreating">
          <span>{{ formatDate(editingProduct.date_modified) }}</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editModalVisible = false">Cancel</el-button>
          <el-button 
            type="primary" 
            @click="saveProduct" 
            :loading="saving"
          >
            {{ isCreating ? 'Create' : 'Update' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Product Detail Modal -->
    <el-dialog 
      v-model="detailModalVisible" 
      title="Product Details"
      width="90%"
      :max-width="screenWidth < 768 ? '95%' : '600px'"
      class="product-dialog"
      top="5vh"
      append-to-body
    >
      <div v-if="selectedProduct" class="product-detail">
        <!-- 响应式布局：移动端垂直排列，桌面端水平排列 -->
        <div class="product-detail-layout">
          <!-- 产品图片 -->
          <div class="product-image">
            <el-image 
              v-if="selectedProduct.images && selectedProduct.images.length > 0" 
              :src="selectedProduct.images[0].src" 
              :preview-src-list="getImagesList(selectedProduct)"
              fit="contain"
              style="width: 100%; max-height: 250px; border-radius: 8px;"
            >
              <template #error>
                <div class="large-image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="large-image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </div>

          <!-- 产品信息 -->
          <div class="product-info">
            <el-descriptions :column="1" border :size="screenWidth < 480 ? 'small' : 'default'">
              <el-descriptions-item label="ID">{{ selectedProduct.id }}</el-descriptions-item>
              <el-descriptions-item label="Name">
                <span v-html="selectedProduct.name"></span>
              </el-descriptions-item>
              <el-descriptions-item label="Price">${{ formatPrice(selectedProduct.price) }}</el-descriptions-item>
              <el-descriptions-item label="Status">
                <el-tag :type="getStatusType(selectedProduct.status)">
                  {{ selectedProduct.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item v-if="!isMobile" label="Link">
                <div class="truncated-link">
                  <a :href="selectedProduct.permalink" target="_blank" class="external-link">
                    {{ selectedProduct.permalink }}
                  </a>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="Created">
                {{ formatDate(selectedProduct.date_created) }}
              </el-descriptions-item>
              <el-descriptions-item label="Last Updated">
                {{ formatDate(selectedProduct.date_modified) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 链接 - 在移动端单独显示 -->
        <div v-if="isMobile" class="mobile-link-section">
          <div class="link-label">Link:</div>
          <a :href="selectedProduct.permalink" target="_blank" class="external-link mobile-link">
            {{ selectedProduct.permalink }}
          </a>
        </div>

        <!-- 操作按钮 -->
        <div class="product-actions">
          <el-button type="primary" @click="handleEdit(selectedProduct)">
            <el-icon><Edit /></el-icon> Edit
          </el-button>
          <el-button type="danger" @click="confirmDelete(selectedProduct)">
            <el-icon><Delete /></el-icon> Delete
          </el-button>
        </div>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Picture } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useWooCommerceStore } from '../store/wooCommerceStore'

// 检测当前应用的暗黑模式状态
const isDark = inject('isDark', ref(false))

// Use the WooCommerce store
const wooStore = useWooCommerceStore()

// Constants
const PAYMENT_LINK_CATEGORY_ID = 359
const DEFAULT_PAGE_SIZE = 20

// Check if API is configured
const isApiConfigured = computed(() => {
  const apiUrl = import.meta.env.VITE_WOO_API_URL
  const consumerKey = import.meta.env.VITE_WOO_CONSUMER_KEY
  const consumerSecret = import.meta.env.VITE_WOO_CONSUMER_SECRET
  
  return !!apiUrl && !!consumerKey && !!consumerSecret && 
    apiUrl !== 'https://your-site.com/wp-json/wc/v3' &&
    consumerKey !== 'your_consumer_key' &&
    consumerSecret !== 'your_consumer_secret'
})

// Modal visibility and state
const editModalVisible = ref(false)
const detailModalVisible = ref(false)
const selectedProduct = ref(null)
const editingProduct = ref({
  name: '',
  price: 0
})
const isCreating = ref(false)
const saving = ref(false)

// Form validation rules
const productRules = {
  name: [
    { required: true, message: 'Please enter a product name', trigger: 'blur' },
    { min: 3, max: 200, message: 'Length should be 3 to 200 characters', trigger: 'blur' }
  ],
  price: [
    { required: true, message: 'Please enter a price', trigger: 'blur' },
    { type: 'number', min: 0, message: 'Price must be greater than 0', trigger: 'blur' }
  ]
}
const productForm = ref(null)

// Computed properties to access store state
const products = computed(() => wooStore.products)
const loading = computed(() => wooStore.loading)
const currentPage = computed({
  get: () => wooStore.currentPage,
  set: (value) => wooStore.setCurrentPage(value)
})
const pageSize = computed({
  get: () => wooStore.pageSize,
  set: (value) => wooStore.setPageSize(value)
})
const totalItems = computed(() => wooStore.totalItems)
const totalPages = computed(() => wooStore.totalPages)

// 响应式设计 - 屏幕宽度
const screenWidth = ref(window.innerWidth)

// 计算属性 - 判断是否为移动端
const isMobile = computed(() => screenWidth.value <= 768)

// 监听窗口大小变化
const handleResize = () => {
  screenWidth.value = window.innerWidth
}

onBeforeMount(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

onMounted(async () => {
  if (isApiConfigured.value) {
    await wooStore.loadProducts()
  }
  handleResize()
})

// Handle page size change
const handleSizeChange = (size) => {
  wooStore.setPageSize(size)
}

// Handle pagination
const handleCurrentChange = (page) => {
  wooStore.setCurrentPage(page)
}

// Format price for display
const formatPrice = (price) => {
  if (!price) return '0.00'
  return parseFloat(price).toFixed(2)
}

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

// Get status type for element-ui tags
const getStatusType = (status) => {
  const statusMap = {
    'publish': 'success',
    'draft': 'info',
    'pending': 'warning',
    'private': 'primary',
    'trash': 'danger'
  }
  return statusMap[status] || 'info'
}

// Get all images for the image preview list
const getImagesList = (product) => {
  if (!product.images || !product.images.length) return []
  return product.images.map(img => img.src)
}

// Handle row click to show product details
const handleRowClick = (row) => {
  selectedProduct.value = row
  detailModalVisible.value = true
}

// Open the create product modal
const openCreateModal = () => {
  isCreating.value = true
  editingProduct.value = {
    name: '',
    price: 0,
    type: 'simple',
    status: 'publish',
    categories: [{ id: PAYMENT_LINK_CATEGORY_ID }],
    images: [
      {
        src: 'https://vertu-website-oss.vertu.com/2024/09/img_4171.jpeg'
      }
    ]
  }
  editModalVisible.value = true
}

// Handle edit button click
const handleEdit = (product) => {
  isCreating.value = false
  editingProduct.value = { ...product }
  detailModalVisible.value = false
  editModalVisible.value = true
}

// Save product changes
const saveProduct = async () => {
  productForm.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    try {
      if (isCreating.value) {
        // Create new product using store
        await wooStore.addProduct({
          name: editingProduct.value.name,
          regular_price: editingProduct.value.price.toString(),
          price: editingProduct.value.price.toString(),
          type: 'simple',
          status: 'publish',
          categories: [{ id: PAYMENT_LINK_CATEGORY_ID }],
          images: editingProduct.value.images
        })
      } else {
        // Update existing product using store
        await wooStore.editProduct(editingProduct.value.id, {
          name: editingProduct.value.name,
          regular_price: editingProduct.value.price.toString(),
          price: editingProduct.value.price.toString()
        })
      }
      
      // Close modal
      editModalVisible.value = false
    } catch (error) {
      console.error('Failed to save product:', error)
    } finally {
      saving.value = false
    }
  })
}

// Confirm product deletion
const confirmDelete = (product) => {
  ElMessageBox.confirm(
    `Are you sure you want to delete the product "${product.name}"?`,
    'Warning',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await wooStore.removeProduct(product.id)
        
        // Close detail modal if open
        if (detailModalVisible.value) {
          detailModalVisible.value = false
        }
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    })
    .catch(() => {
      // User cancelled the deletion
    })
}
</script>

<style scoped>
.payment-link-products {
  height: 100%;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.main-content {
  margin-top: 20px;
}

.api-not-configured {
  margin: 20px 0;
}

.mt-3 {
  margin-top: 12px;
}

.code-block {
  background-color: var(--el-fill-color-darker);
  border-radius: 4px;
  padding: 12px;
  margin-top: 10px;
  font-family: monospace;
  white-space: pre;
  overflow-x: auto;
  color: var(--el-text-color-primary);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.image-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-darker);
  border-radius: 4px;
  color: var(--el-text-color-secondary);
}

.large-image-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-darker);
  border-radius: 8px;
  color: var(--el-text-color-secondary);
  font-size: 32px;
}

.product-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-detail-layout {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.product-image {
  flex: 1;
  max-width: 45%;
}

.product-info {
  flex: 1;
  min-width: 55%;
}

.product-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.truncated-link {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.mobile-link-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  margin-top: -10px;
}

.link-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.mobile-link {
  font-size: 12px;
  word-break: break-all;
}

.product-name {
  font-weight: 500;
}

.external-link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.external-link:hover {
  text-decoration: underline;
}

/* 自定义表格样式 */
:deep(.product-table) {
  --el-table-border-color: var(--el-border-color-light);
  --el-table-header-bg-color: var(--el-bg-color);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  background-color: transparent;
  color: var(--el-text-color-primary);
  border: none;
}

:deep(.product-table::before),
:deep(.product-table::after) {
  display: none;
}

/* 表头样式 */
:deep(.product-table th.el-table__cell) {
  background-color: transparent;
  border: none;
  color: var(--el-text-color-secondary);
  font-weight: normal;
  padding: 12px 0;
}

/* 单元格样式 */
:deep(.product-table td.el-table__cell) {
  background-color: transparent;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  padding: 12px 0;
}

/* 斑马纹效果 */
:deep(.product-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: var(--el-fill-color-light);
}

/* 悬停效果 */
:deep(.product-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--el-fill-color) !important;
}

/* 表格行样式 */
:deep(.product-table .el-table__row) {
  background-color: transparent;
}

/* 卡片和深色模式适配 */
:deep(.el-card) {
  --el-card-bg-color: var(--el-bg-color);
  --el-card-border-color: var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s;
}

:deep(.el-card__header) {
  border-bottom-color: var(--el-border-color-light);
  padding: 15px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

@media screen and (max-width: 768px) {
  :deep(.el-card__body) {
    padding: 2px !important;
  }
}

/* 分页样式 */
:deep(.el-pagination) {
  --el-pagination-bg-color: var(--el-bg-color);
  --el-pagination-hover-color: var(--el-color-primary);
  --el-pagination-button-bg-color: var(--el-bg-color);
  --el-pagination-button-color: var(--el-text-color-primary);
  --el-pagination-button-disabled-color: var(--el-text-color-secondary);
}

:deep(.el-pagination .el-select .el-input) {
  width: 110px;
}

/* 表格样式 */
:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

:deep(.el-table th) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

:deep(.el-table td) {
  border-bottom-color: var(--el-border-color-lighter);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: var(--el-fill-color-light) !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: var(--el-fill-color-light);
}

/* 对话框样式 */
:deep(.el-dialog) {
  background-color: var(--el-bg-color);
}

:deep(.el-dialog__title) {
  color: var(--el-text-color-primary);
}

:deep(.el-descriptions) {
  --el-descriptions-item-bordered-label-background: var(--el-fill-color-light);
}

:deep(.el-descriptions-item__label) {
  color: var(--el-text-color-primary);
}

:deep(.el-descriptions-item__content) {
  color: var(--el-text-color-primary);
}

:deep(.el-form-item__label) {
  color: var(--el-text-color-primary);
}

:deep(.el-input__inner) {
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color-blank);
}

:deep(.el-button) {
  transition: all 0.3s;
}

/* 修复暗黑模式下的一些特殊元素 */
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background-color: var(--el-fill-color-dark);
  color: var(--el-text-color-primary);
  border-color: var(--el-border-color);
}

:deep(.el-alert--warning) {
  background-color: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

/* 暗黑模式特定样式 */
.payment-link-products.is-dark {
  color: var(--el-text-color-primary);
}

.payment-link-products.is-dark :deep(.el-table th), 
.payment-link-products.is-dark :deep(.el-table td) {
  background-color: var(--el-bg-color);
  border-bottom-color: var(--el-border-color-light);
  color: var(--el-text-color-primary);
}

.payment-link-products.is-dark :deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: var(--el-color-primary-dark-2) !important;
  color: #fff !important;
}

.payment-link-products.is-dark :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
}

.payment-link-products.is-dark :deep(.external-link) {
  color: var(--el-color-primary-light-3);
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .payment-link-products {
    padding: 10px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 10px;
  }
    
  .title {
    font-size: 15px;
  }
  
  .actions {
    width: 100%;
  }
  
  .action-buttons {
    display: flex;
    gap: 6px;
  }
  
  .pagination-container {
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  
  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  :deep(.el-descriptions) {
    width: 100%;
  }
  
  :deep(.el-descriptions-item__label) {
    width: 90px;
    min-width: 90px;
    padding: 8px 10px;
  }
  
  :deep(.el-descriptions-item__content) {
    padding: 8px 10px;
  }
  
  :deep(.el-form-item__label) {
    min-width: 80px;
  }
  
  /* 移动端表格布局优化 */
  :deep(.el-table) {
    width: 100%;
    overflow-x: auto;
  }
  
  /* 调整表格单元格间距 */
  :deep(.el-table .cell) {
    padding: 8px 6px;
  }
  
  /* 隐藏不重要的列 */
  :deep(.el-table__header-wrapper .is-hidden-sm-and-down),
  :deep(.el-table__body-wrapper .is-hidden-sm-and-down) {
    display: none;
  }
  
  .large-image-placeholder {
    height: 140px;
  }
  
  .product-detail {
    gap: 12px;
  }
  
  .product-actions {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  
  .code-block {
    padding: 10px;
    font-size: 12px;
  }
}

/* 小屏幕设备优化 */
@media screen and (max-width: 480px) {
  .payment-link-products {
    padding: 8px;
  }
  
  .title {
    font-size: 14px;
  }
  
  :deep(.el-table-column--mini) {
    min-width: 56px;
  }
  
  :deep(.el-pagination .el-select .el-input) {
    width: 85px;
  }
  
  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next) {
    min-width: 26px;
  }
  
  :deep(.el-pagination .el-pager li) {
    min-width: 26px;
    font-size: 11px;
  }
  
  .code-block {
    font-size: 11px;
    padding: 8px;
    margin-top: 8px;
  }
  
  .product-form {
    padding: 0;
  }
  
  :deep(.el-form-item__label) {
    font-size: 13px;
    min-width: 70px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  
  .large-image-placeholder {
    height: 120px;
    font-size: 24px;
  }
  
  .image-placeholder {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 768px) {
  .product-detail-layout {
    flex-direction: column;
    gap: 15px;
  }
  
  .product-image, .product-info {
    max-width: 100%;
    width: 100%;
  }
  
  .product-actions {
    margin-top: 5px;
    justify-content: center;
  }
  
  .large-image-placeholder {
    height: 150px;
    font-size: 24px;
  }
  
  .el-col {
    width: 100%;
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .product-detail {
    gap: 12px;
  }
  
  .product-detail-layout {
    gap: 10px;
  }
  
  .large-image-placeholder {
    height: 120px;
    font-size: 20px;
  }
  
  .product-actions {
    flex-wrap: wrap;
  }
  
  .product-actions .el-button {
    flex: 1;
    min-width: 40%;
    padding: 8px;
    font-size: 12px;
  }
  
  .product-actions .el-button .el-icon {
    margin-right: 4px;
  }
  
  .mobile-link-section {
    padding: 8px;
  }
}
</style>

<style>
/* 弹窗全局样式 */
.product-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.product-dialog .el-dialog__header {
  border-bottom: 1px solid var(--el-border-color);
  padding: 15px 20px;
  margin-right: 0;
}

.product-dialog .el-dialog__body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.product-dialog .el-dialog__footer {
  padding: 10px 20px 15px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.product-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--el-color-primary);
}

/* 移动端弹窗适配 */
@media (max-width: 768px) {
  .product-dialog .el-dialog__body {
    padding: 15px;
    max-height: 60vh;
  }
  
  .product-dialog .el-dialog__header {
    padding: 12px 15px;
  }
  
  .product-dialog .el-dialog__footer {
    padding: 10px 15px;
  }
  
  .product-dialog .el-form-item {
    margin-bottom: 15px;
  }
  
  .el-descriptions-row {
    flex-wrap: wrap;
  }
  
  .product-dialog .el-dialog__title {
    font-size: 16px;
  }
  
  .product-form {
    padding: 0;
  }
  
  .product-dialog .large-image-placeholder {
    height: 150px;
  }
}

/* 小屏幕弹窗进一步优化 */
@media (max-width: 480px) {
  .product-dialog .el-dialog__body {
    padding: 12px;
    max-height: 65vh;
  }
  
  .product-dialog .el-dialog__header {
    padding: 10px 12px;
  }
  
  .product-dialog .el-dialog__title {
    font-size: 15px;
  }
  
  .product-dialog .el-form-item__label {
    font-size: 13px;
  }
  
  .product-dialog .product-detail {
    gap: 10px;
  }
  
  .product-dialog .large-image-placeholder {
    height: 120px;
  }
}

/* 暗黑模式下的弹窗 */
html.dark .product-dialog,
html.dark .product-dialog .el-dialog__header,
html.dark .product-dialog .el-dialog__body,
html.dark .product-dialog .el-dialog__footer {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

html.dark .product-dialog .el-descriptions__cell {
  background-color: var(--el-bg-color);
}

html.dark .product-dialog .el-descriptions__label {
  background-color: var(--el-fill-color-darker);
}

html.dark .product-dialog .el-form-item__label {
  color: var(--el-text-color-primary);
}

html.dark .product-dialog .el-input__inner {
  background-color: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
}

html.dark .product-dialog .el-input-number {
  background-color: var(--el-bg-color-overlay);
}
</style> 