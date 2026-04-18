/**
 * ============================================
 * 认证状态管理 (stores/authStore.js)
 * ============================================
 *
 * 【模块职责】
 * - 存储当前登录用户信息
 * - 提供 userId、user 对象
 * - persist: true → 数据持久化到 localStorage
 *
 * 【数据结构】
 * - userId: string | null    → 用户唯一标识
 * - user: object | null     → Supabase 用户对象
 */
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
