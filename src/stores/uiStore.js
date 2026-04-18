/**
 * ============================================
 * UI 状态管理 (stores/uiStore.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理全局 UI 状态（如导航栏显示/隐藏）
 *
 * 【数据结构】
 * - navbarHidden: boolean    → 导航栏是否隐藏
 */
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    navbarHidden: false
  }),
  actions: {
    setNavbarHidden(hidden) {
      this.navbarHidden = hidden
    }
  }
})
