// authStore.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 用户认证状态管理
 * persist: true → 状态自动同步到 localStorage，刷新后恢复登录态
 */
export const useAuthStore = defineStore('auth', () => {
  // ── 状态 ──
  // 当前登录用户 ID，null 表示未登录
  const userId = ref<string | null>(null)
  // 当前登录用户完整对象（兼容 Supabase Auth 返回的 User）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = ref<any>(null)

  // ── Actions ──
  // 设置用户信息，同时更新 userId，支持 Supabase User 和自定义 User 类型
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setUser = (userData: any): void => {
    user.value = userData
    // 取 userData.id 赋值，兼容对象为 null/undefined 的边界情况
    userId.value = userData?.id || null
  }

  // 清除登录状态，登出时调用，确保 userId 和 user 同时重置
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
