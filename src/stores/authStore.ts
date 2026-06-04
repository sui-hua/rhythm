import { defineStore } from 'pinia'
import { ref } from 'vue'

// persist: true → 状态自动同步到 localStorage，刷新后恢复登录状态
export const useAuthStore = defineStore('auth', () => {
  // 当前登录用户 ID
  const userId = ref<string | null>(null)
  // 当前登录用户对象（兼容 Supabase Auth 返回的 User）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = ref<any>(null)

  // 设置用户信息，同时更新 userId
  // 使用 any 兼容 Supabase User 和自定义 User
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setUser = (userData: any): void => {
    user.value = userData
    userId.value = userData?.id || null
  }

  // 清除登录状态
  const clearAuth = (): void => {
    userId.value = null
    user.value = null
  }

  return {
    userId,
    user,
    setUser,
    clearAuth
  }
}, { persist: true })
