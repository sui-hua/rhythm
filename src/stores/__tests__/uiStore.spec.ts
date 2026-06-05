import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '@/stores/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始 navbarHidden=false', () => {
    const store = useUiStore()
    expect(store.navbarHidden).toBe(false)
  })

  it('setNavbarHidden(true) → navbarHidden=true', () => {
    const store = useUiStore()
    store.setNavbarHidden(true)
    expect(store.navbarHidden).toBe(true)
  })

  it('setNavbarHidden(false) → navbarHidden=false', () => {
    const store = useUiStore()
    store.setNavbarHidden(true)
    expect(store.navbarHidden).toBe(true)

    store.setNavbarHidden(false)
    expect(store.navbarHidden).toBe(false)
  })
})
