import { setActivePinia, createPinia } from 'pinia'
import { describe, expect, it, beforeEach } from 'vitest'
import { usePageStateStore } from '@/stores/pageStateStore'

describe('pageStateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('resets page-level transient states in one call', () => {
    const store = usePageStateStore()
    store.state.day.showAddDrawer = true
    store.state.summary.isCreating = true
    store.resetAll()

    expect(store.state.day.showAddDrawer).toBe(false)
    expect(store.state.summary.isCreating).toBe(false)
  })

  it('has correct initial state', () => {
    const store = usePageStateStore()
    expect(store.state.day.showAddDrawer).toBe(false)
    expect(store.state.day.editingTaskIndex).toBe(null)
    expect(store.state.summary.isCreating).toBe(false)
    expect(store.state.direction.showCategoryModal).toBe(false)
  })
})

