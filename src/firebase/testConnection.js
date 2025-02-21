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
    return false
  }
} 