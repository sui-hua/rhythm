import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDirectionStore } from '@/stores/directionStore'

vi.mock('@/services/database', () => ({
  db: {
    plans: { list: vi.fn() },
    goalMonths: { list: vi.fn() },
    dailyPlans: { list: vi.fn() }
  }
}))

describe('directionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useDirectionStore()
    store.reset()
  })

  it('has correct initial state', () => {
    const store = useDirectionStore()
    
    expect(store.goals).toEqual([])
    expect(store.goalMonths).toEqual([])
    expect(store.selectedGoal).toBe(null)
    expect(store.editingGoal).toBe(null)
    expect(store.selectedMonth).toBe(null)
    expect(store.activePicker).toBe('start')
    expect(store.isSelecting).toBe(false)
    expect(store.showAddModal).toBe(false)
    expect(store.showCategoryModal).toBe(false)
    expect(store.initialized).toBe(false)
    expect(store.categories).toEqual([])
  })

  it('resets all state to initial values', () => {
    const store = useDirectionStore()
    
    store.goals = [{ id: 'p1', title: 'Test Plan' }]
    store.goalMonths = [{ id: 'mp1' }]
    store.selectedGoal = { id: 'p1' }
    store.editingGoal = { id: 'p1' }
    store.selectedMonth = 4
    store.activePicker = 'end'
    store.isSelecting = true
    store.showAddModal = true
    store.showCategoryModal = true
    store.initialized = true
    store.categories = [{ id: 'c1' }]
    
    store.$patch({
      goalMonthsCache: { p1: [{ id: 'mp1' }] },
      goalDaysCache: { mp1: [{ id: 'dp1' }] },
      goalMonthsMap: { 'goal-p1-4': { id: 'mp1' } },
      dailyTasks: { 'goal-p1-4-30': { id: 'dp1' } },
      selectedDates: { 4: [1, 2, 3] },
      batchInput: 'test',
      archiveVersion: 5
    })
    
    store.reset()
    
    expect(store.goals).toEqual([])
    expect(store.goalMonths).toEqual([])
    expect(store.selectedGoal).toBe(null)
    expect(store.editingGoal).toBe(null)
    expect(store.selectedMonth).toBe(null)
    expect(store.activePicker).toBe('start')
    expect(store.isSelecting).toBe(false)
    expect(store.showAddModal).toBe(false)
    expect(store.showCategoryModal).toBe(false)
    expect(store.initialized).toBe(false)
    expect(store.categories).toEqual([])
    expect(store.goalMonthsCache).toEqual({})
    expect(store.goalDaysCache).toEqual({})
    expect(store.goalMonthsMap).toEqual({})
    expect(store.dailyTasks).toEqual({})
    expect(store.selectedDates).toEqual({})
    expect(store.batchInput).toBe('')
    expect(store.archiveVersion).toBe(0)
  })

  it('provides reactive state', () => {
    const store = useDirectionStore()
    
    store.selectedGoal = { id: 'p1', title: 'Goal 1' }
    store.selectedMonth = 6
    
    expect(store.selectedGoal.id).toBe('p1')
    expect(store.selectedMonth).toBe(6)
  })

  it('clears daily plans cache optionally keeping one', () => {
    const store = useDirectionStore()
    
    // Use Object.assign to modify reactive in place
    Object.assign(store.goalDaysCache, {
      mp1: [{ id: 'dp1' }],
      mp2: [{ id: 'dp2' }],
      mp3: [{ id: 'dp3' }]
    })
    
    store.clearGoalDaysCache('mp2')
    
    expect(store.goalDaysCache.mp2).toEqual([{ id: 'dp2' }])
    expect(store.goalDaysCache.mp1).toBeUndefined()
    expect(store.goalDaysCache.mp3).toBeUndefined()
  })

  it('clears all daily plans cache when no keepId provided', () => {
    const store = useDirectionStore()
    
    Object.assign(store.goalDaysCache, {
      mp1: [{ id: 'dp1' }],
      mp2: [{ id: 'dp2' }]
    })
    
    store.clearGoalDaysCache()
    
    expect(Object.keys(store.goalDaysCache)).toHaveLength(0)
  })

  it('syncs monthly plans cache to flat list', () => {
    const store = useDirectionStore()
    
    Object.assign(store.goalMonthsCache, {
      p1: [
        { id: 'mp1', goal_id: 'p1', month: '2026-04-01' },
        { id: 'mp2', goal_id: 'p1', month: '2026-05-01' }
      ]
    })
    store.goalMonths = [
      { id: 'mp-old', goal_id: 'p2', month: '2026-03-01' }
    ]
    
    store.syncGoalMonthsToFlatList('p1')
    
    expect(store.goalMonths.find(mp => mp.id === 'mp-old')).toBeDefined()
    expect(store.goalMonths.find(mp => mp.id === 'mp1')).toBeDefined()
    expect(store.goalMonths.find(mp => mp.id === 'mp2')).toBeDefined()
  })

  it('gets monthly plans by plan id', () => {
    const store = useDirectionStore()
    
    Object.assign(store.goalMonthsCache, {
      p1: [{ id: 'mp1', goal_id: 'p1', month: '2026-04-01' }],
      p2: [{ id: 'mp2', goal_id: 'p2', month: '2026-05-01' }]
    })
    
    const result = store.getGoalMonthsByGoalId('p1')
    
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('mp1')
  })

  it('gets empty array for unknown plan id', () => {
    const store = useDirectionStore()
    
    const result = store.getGoalMonthsByGoalId('unknown')
    
    expect(result).toEqual([])
  })
})
