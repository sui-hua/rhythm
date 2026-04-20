/**
 * ============================================
 * 认证状态管理 (stores/authStore.js)
 * ============================================
 *
 * 【模块职责】
 * - 集中管理用户认证状态（登录/登出）
 * - 存储当前登录用户的 userId 和 user 对象
 * - 与 Supabase 认证系统集成
 *
 * 【数据结构】
 * - userId: string | null    → 用户唯一标识（从 user.id 提取）
 * - user: object | null      → Supabase Auth 用户对象完整数据
 *
 * 【持久化】
 * - persist: true → 启用 Pinia Persist，状态自动同步到 localStorage
 * - 页面刷新后自动恢复登录状态
 *
 * 【与 Supabase 的关系】
 * - 初始化时从 supabase.auth.getSession() 恢复会话
 * - 登录后通过 setUser() 更新状态
 * - 登出时通过 clearAuth() 清除状态
 *
 * @module stores/authStore
 * @see {@link https://pinia.vuejs.org/ Pinia 文档}
 * @see {@link https://supabase.com/docs/guides/auth Supabase Auth 文档}
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  /**
   * 当前登录用户的唯一标识
   * @type {import('vue').Ref<string | null>}
   * @description 从 Supabase user.id 提取，用于快速判断登录状态和用户标识
   */
  const userId = ref(null)

  /**
   * Supabase Auth 用户对象的完整引用
   * @type {import('vue').Ref<object | null>}
   * @description 包含用户的完整信息（id, email, metadata 等），用于获取用户详情
   * @see {@link https://supabase.com/docs/reference/javascript/auth-getuser Supabase User 对象结构}
   */
  const user = ref(null)

  /**
   * 设置当前认证用户
   * @param {object | null} userData - Supabase 用户对象，登录成功后的 session.user
   * @param {string} [userData.id] - 用户的唯一标识
   * @returns {void}
   * @description
   * - 将 userData 存储到 user ref 中
   * - 同步提取 id 字段存储到 userId ref
   * - 当 userData 为 null 或 undefined 时，两者都设为 null
   *
   * @example
   * // 登录成功后设置用户
   * const { data } = await supabase.auth.signInWithPassword({ email, password })
   * setUser(data.session.user)
   */
  const setUser = (userData) => {
    user.value = userData
    userId.value = userData?.id || null
  }

  /**
   * 清除认证状态（登出）
   * @returns {void}
   * @description
   * - 将 userId 和 user 都重置为 null
   * - 通常在调用 supabase.auth.signOut() 后触发
   * - 配合路由守卫可实现自动跳转登录页
   *
   * @example
   * // 登出
   * await supabase.auth.signOut()
   * clearAuth()
   */
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
