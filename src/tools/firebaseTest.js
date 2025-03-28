import { db } from '../firebase/config'
import { collection, getDocs, addDoc, deleteDoc, query, limit } from 'firebase/firestore'

// 测试 Firestore 连接的函数
export const testFirestoreConnection = async () => {
  const results = {
    success: false,
    readTest: false,
    writeTest: false,
    deleteTest: false,
    errorDetails: null
  }

  try {
    console.log('开始测试 Firestore 连接...')
    
    // 1. 尝试读取测试集合
    console.log('1. 测试读取操作...')
    const testCollection = collection(db, 'test')
    const q = query(testCollection, limit(1))
    const snapshot = await getDocs(q)
    
    results.readTest = true
    console.log(`读取测试成功! 找到 ${snapshot.size} 个文档`)
    
    // 2. 尝试写入测试文档
    console.log('2. 测试写入操作...')
    const docRef = await addDoc(testCollection, {
      message: 'Firestore connection test',
      timestamp: new Date(),
      testId: `test-${Date.now()}`
    })
    
    results.writeTest = true
    console.log(`写入测试成功! 文档ID: ${docRef.id}`)
    
    // 3. 尝试删除刚创建的文档
    console.log('3. 测试删除操作...')
    await deleteDoc(docRef)
    
    results.deleteTest = true
    console.log('删除测试成功!')
    
    // 所有测试成功
    results.success = true
    console.log('Firestore 连接测试完成: 成功!')
    return results
    
  } catch (error) {
    console.error('Firestore 连接测试失败:', error)
    results.errorDetails = {
      code: error.code,
      message: error.message,
      full: JSON.stringify(error)
    }
    
    // 根据错误类型提供更多信息
    if (error.code === 'permission-denied') {
      console.error('权限错误: Firestore 安全规则阻止了操作。请检查控制台中的安全规则设置。')
    } else if (error.code === 'unavailable') {
      console.error('服务不可用: 请检查您的网络连接和防火墙设置。')
    } else if (error.code === 'not-found') {
      console.error('未找到资源: 请确认项目ID和数据库配置正确。')
    }
    
    return results
  }
}

// 导出一个简单的测试函数，可以在控制台中直接调用
export const runFirestoreTest = async () => {
  console.log('============================')
  console.log('Firebase Firestore 连接测试')
  console.log('============================')
  
  const results = await testFirestoreConnection()
  
  console.log('============================')
  console.log('测试结果摘要:')
  console.log(`总体状态: ${results.success ? '✅ 成功' : '❌ 失败'}`)
  console.log(`读取操作: ${results.readTest ? '✅ 成功' : '❌ 失败'}`)
  console.log(`写入操作: ${results.writeTest ? '✅ 成功' : '❌ 失败'}`)
  console.log(`删除操作: ${results.deleteTest ? '✅ 成功' : '❌ 失败'}`)
  
  if (!results.success) {
    console.error('错误详情:', results.errorDetails)
  }
  
  return results
} 