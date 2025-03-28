/**
 * Firestore 安全规则生成工具
 * 
 * 使用方法：
 * 1. 复制以下规则
 * 2. 登录 Firebase 控制台: https://console.firebase.google.com/
 * 3. 选择您的项目
 * 4. 进入 Firestore Database > Rules
 * 5. 粘贴并发布这些规则
 */

const firestoreRules = `
// Firestore 规则 v2
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 测试集合 - 允许读写用于连接测试
    match /test/{document=**} {
      allow read, write: if true;
    }
    
    // API 统计集合 - 允许读写
    match /api_stats/{document=**} {
      allow read, write: if true;
    }
    
    // 搜索结果缓存 - 允许读写
    match /search_results/{document=**} {
      allow read, write: if true;
    }
    
    // 搜索刷新记录 - 允许读写
    match /search_refreshes/{document=**} {
      allow read, write: if true;
    }
    
    // 性能指标集合 - 允许读写
    match /performance_metrics/{document=**} {
      allow read, write: if true;
    }
    
    // 搜索性能指标 - 允许读写
    match /searchMetrics/{document=**} {
      allow read, write: if true;
    }
    
    // 作为额外的安全措施，拒绝对所有其他集合的访问
    // match /{document=**} {
    //   allow read, write: if false;
    // }
  }
}
`;

console.log("=".repeat(50));
console.log("Firestore 安全规则");
console.log("=".repeat(50));
console.log(firestoreRules);
console.log("=".repeat(50));
console.log("请将这些规则复制到 Firebase 控制台的 Firestore Rules 配置中");

// 如果您需要从代码中生成这些规则（例如在部署脚本中），可以使用：
export const getFirestoreRules = () => firestoreRules; 