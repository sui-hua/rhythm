import { setActivePinia, createPinia } from 'pinia'
import { describe, expect, it, beforeEach } from 'vitest'
import { usePageStateStore } from '@/stores/pageStateStore'

describe('pageStateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('resets page-level transient states in one call', () => {
    const store = usePageStateStore()
    store.day.showAddDrawer = true
    store.summary.isCreating = true
    store.resetAll()

    expect(store.day.showAddDrawer).toBe(false)
    expect(store.summary.isCreating).toBe(false)
  })

  it('has correct initial state', () => {
    const store = usePageStateStore()
    expect(store.day.showAddDrawer).toBe(false)
    expect(store.day.editingTaskIndex).toBe(null)
    expect(store.summary.isCreating).toBe(false)
    expect(store.direction.showCategoryModal).toBe(false)
  })
})
