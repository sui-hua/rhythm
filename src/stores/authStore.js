import { defineStore } from 'pinia'
import { ref } from 'vue'

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
