import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDirectionStore } from '@/stores/directionStore'

vi.mock('@/services/database', () => ({
  db: {
    plans: { list: vi.fn() },
    monthlyPlans: { list: vi.fn() },
    dailyPlans: { list: vi.fn() }
  }
}))

describe('directionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has correct initial state', () => {
    const store = useDirectionStore()
    
    expect(store.plans).toEqual([])
    expect(store.monthlyPlans).toEqual([])
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
    
    store.plans = [{ id: 'p1', title: 'Test Plan' }]
    store.monthlyPlans = [{ id: 'mp1' }]
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
      monthlyPlansCache: { p1: [{ id: 'mp1' }] },
      dailyPlansCache: { mp1: [{ id: 'dp1' }] },
      monthlyMainGoals: { 'plan-p1-4': { id: 'mp1' } },
      dailyTasks: { 'plan-p1-4-30': { id: 'dp1' } },
      selectedDates: { 4: [1, 2, 3] },
      batchInput: 'test',
      archiveVersion: 5
    })
    
    store.reset()
    
    expect(store.plans).toEqual([])
    expect(store.monthlyPlans).toEqual([])
    expect(store.selectedGoal).toBe(null)
    expect(store.editingGoal).toBe(null)
    expect(store.selectedMonth).toBe(null)
    expect(store.activePicker).toBe('start')
    expect(store.isSelecting).toBe(false)
    expect(store.showAddModal).toBe(false)
    expect(store.showCategoryModal).toBe(false)
    expect(store.initialized).toBe(false)
    expect(store.categories).toEqual([])
    expect(store.monthlyPlansCache).toEqual({})
    expect(store.dailyPlansCache).toEqual({})
    expect(store.monthlyMainGoals).toEqual({})
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
    Object.assign(store.dailyPlansCache, {
      mp1: [{ id: 'dp1' }],
      mp2: [{ id: 'dp2' }],
      mp3: [{ id: 'dp3' }]
    })
    
    store.clearDailyPlansCache('mp2')
    
    expect(store.dailyPlansCache.mp2).toEqual([{ id: 'dp2' }])
    expect(store.dailyPlansCache.mp1).toBeUndefined()
    expect(store.dailyPlansCache.mp3).toBeUndefined()
  })

  it('clears all daily plans cache when no keepId provided', () => {
    const store = useDirectionStore()
    
    Object.assign(store.dailyPlansCache, {
      mp1: [{ id: 'dp1' }],
      mp2: [{ id: 'dp2' }]
    })
    
    store.clearDailyPlansCache()
    
    expect(Object.keys(store.dailyPlansCache)).toHaveLength(0)
  })

  it('syncs monthly plans cache to flat list', () => {
    const store = useDirectionStore()
    
    Object.assign(store.monthlyPlansCache, {
      p1: [
        { id: 'mp1', plan_id: 'p1', month: '2026-04-01' },
        { id: 'mp2', plan_id: 'p1', month: '2026-05-01' }
      ]
    })
    store.monthlyPlans = [
      { id: 'mp-old', plan_id: 'p2', month: '2026-03-01' }
    ]
    
    store.syncMonthlyPlansToFlatList('p1')
    
    expect(store.monthlyPlans.find(mp => mp.id === 'mp-old')).toBeDefined()
    expect(store.monthlyPlans.find(mp => mp.id === 'mp1')).toBeDefined()
    expect(store.monthlyPlans.find(mp => mp.id === 'mp2')).toBeDefined()
  })

  it('gets monthly plans by plan id', () => {
    const store = useDirectionStore()
    
    Object.assign(store.monthlyPlansCache, {
      p1: [{ id: 'mp1', plan_id: 'p1', month: '2026-04-01' }],
      p2: [{ id: 'mp2', plan_id: 'p2', month: '2026-05-01' }]
    })
    
    const result = store.getMonthlyPlansByPlanId('p1')
    
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('mp1')
  })

  it('gets empty array for unknown plan id', () => {
    const store = useDirectionStore()
    
    const result = store.getMonthlyPlansByPlanId('unknown')
    
    expect(result).toEqual([])
  })
})
