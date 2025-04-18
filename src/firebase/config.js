import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// 添加日志记录配置
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase 初始化配置:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  })
}

export { db } 