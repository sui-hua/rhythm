import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'

describe('goalSelectionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态全部为默认值', () => {
    const store = useGoalSelectionStore()
    expect(store.selectedGoal).toBeNull()
    expect(store.editingGoal).toBeNull()
    expect(store.selectedMonth).toBeNull()
    expect(store.activePicker).toBe('start')
    expect(store.isSelecting).toBe(false)
  })

  it('修改状态后 reset 可恢复默认', () => {
    const store = useGoalSelectionStore()
    store.activePicker = 'end'
    store.isSelecting = true
    store.selectedMonth = 6

    store.reset()

    expect(store.selectedGoal).toBeNull()
    expect(store.editingGoal).toBeNull()
    expect(store.selectedMonth).toBeNull()
    expect(store.activePicker).toBe('start')
    expect(store.isSelecting).toBe(false)
  })
})
