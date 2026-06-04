import { defineStore } from 'pinia'

/** UI 状态接口 */
interface UiState {
  navbarHidden: boolean
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    navbarHidden: false
  }),
  actions: {
    // 设置导航栏隐藏状态
    setNavbarHidden(hidden: boolean): void {
      this.navbarHidden = hidden
    }
  }
})
