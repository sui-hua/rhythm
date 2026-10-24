// uiStore.ts

import { defineStore } from 'pinia'

/** UI 全局状态接口 */
interface UiState {
  navbarHidden: boolean
}

/**
 * 界面 UI 状态管理
 * 采用 Options API 风格（状态简单，无需 Composition API）
 */
export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    // 导航栏是否隐藏，用于全屏场景（如番茄钟）下隐藏顶部导航
    navbarHidden: false
  }),
  actions: {
    // 设置导航栏隐藏状态
    setNavbarHidden(hidden: boolean): void {
      this.navbarHidden = hidden
    }
  }
})
