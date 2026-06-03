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
