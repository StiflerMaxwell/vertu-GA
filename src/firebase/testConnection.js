import { db } from './config'
import { collection, addDoc, getDocs } from 'firebase/firestore'

export const testFirebaseConnection = async () => {
  try {
    // 尝试写入测试数据
    const testCollection = collection(db, 'test')
    await addDoc(testCollection, {
      message: 'Test connection',
      timestamp: new Date()
    })

    // 尝试读取数据
    const querySnapshot = await getDocs(testCollection)
    console.log('Firebase connected! Documents count:', querySnapshot.size)
    return true
  } catch (error) {
    console.error('Firebase connection test failed:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    
    // 根据错误代码提供更具体的信息
    if (error.code === 'permission-denied') {
      console.error('权限被拒绝，请检查 Firestore 安全规则')
    } else if (error.code === 'unavailable') {
      console.error('Firebase 服务不可用，请检查网络连接')
    }
    
    return false
  }
} 