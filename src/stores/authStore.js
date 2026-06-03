import { defineStore } from 'pinia'
import { ref } from 'vue'

// persist: true → 状态自动同步到 localStorage，刷新后恢复登录状态
export const useAuthStore = defineStore('auth', () => {
  const userId = ref(null)
  const user = ref(null)

  const setUser = (userData) => {
    user.value = userData
    userId.value = userData?.id || null
  }

  const clearAuth = () => {
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
