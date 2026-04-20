/**
 * UI Store - 全局 UI 状态管理
 * @description 管理全局 UI 状态，包括导航栏显示/隐藏等
 * @module stores/uiStore
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
