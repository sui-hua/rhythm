import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGoalDataStore } from '@/stores/goalDataStore'

describe('goalDataStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态为空/默认值', () => {
    const store = useGoalDataStore()
    expect(store.goals).toEqual([])
    expect(store.goalMonths).toEqual([])
    expect(Object.keys(store.goalMonthsCache)).toHaveLength(0)
    expect(Object.keys(store.goalDaysCache)).toHaveLength(0)
    expect(store.archiveVersion).toBe(0)
    expect(store.categories).toEqual([])
    expect(store.initialized).toBe(false)
    expect(store.showAddModal).toBe(false)
    expect(store.showCategoryModal).toBe(false)
  })

  it('reset 清空所有缓存和状态', () => {
    const store = useGoalDataStore()

    store.goals = [{ id: 'g-1' }] as any
    store.goalMonths = [{ id: 'gm-1' }] as any
    store.goalMonthsCache['g-1'] = [{ id: 'gm-1' }] as any
    store.goalDaysCache['gm-1'] = [{ id: 'gd-1' }] as any
    store.archiveVersion = 5
    store.categories = [{ id: 'c-1' }] as any
    store.initialized = true
    store.showAddModal = true
    store.showCategoryModal = true

    store.reset()

    expect(store.goals).toEqual([])
    expect(store.goalMonths).toEqual([])
    expect(Object.keys(store.goalMonthsCache)).toHaveLength(0)
    expect(Object.keys(store.goalDaysCache)).toHaveLength(0)
    expect(store.archiveVersion).toBe(0)
    expect(store.categories).toEqual([])
    expect(store.initialized).toBe(false)
    expect(store.showAddModal).toBe(false)
    expect(store.showCategoryModal).toBe(false)
  })

  it('clearGoalDaysCache 清空日计划缓存', () => {
    const store = useGoalDataStore()
    store.goalDaysCache['gm-1'] = [{ id: 'gd-1' }] as any
    store.goalDaysCache['gm-2'] = [{ id: 'gd-2' }] as any

    store.clearGoalDaysCache()

    expect(Object.keys(store.goalDaysCache)).toHaveLength(0)
  })

  it('clearGoalDaysCache(keepMonthPlanId) 保留指定缓存', () => {
    const store = useGoalDataStore()
    const data1 = [{ id: 'gd-1' }] as any
    const data2 = [{ id: 'gd-2' }] as any
    store.goalDaysCache['gm-1'] = data1
    store.goalDaysCache['gm-2'] = data2

    store.clearGoalDaysCache('gm-1')

    expect(Object.keys(store.goalDaysCache)).toHaveLength(1)
    expect(store.goalDaysCache['gm-1']).toEqual(data1)
  })

  it('getGoalMonthsByGoalId 返回缓存数据或空数组', () => {
    const store = useGoalDataStore()
    const cached = [{ id: 'gm-1' }] as any
    store.goalMonthsCache['g-1'] = cached

    expect(store.getGoalMonthsByGoalId('g-1')).toEqual(cached)
    expect(store.getGoalMonthsByGoalId('nonexistent')).toEqual([])
  })
})
