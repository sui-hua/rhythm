import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGoalDataStore } from '@/stores/goalDataStore'
import type { Goal } from '@/services/db/goal'
import type { GoalCategory } from '@/services/db/goalCategories'
import type { GoalDay } from '@/services/db/goalDays'
import type { GoalMonth } from '@/services/db/goalMonths'

const goal = (id: string): Goal => ({ id, title: `目标 ${id}` })
const goalMonth = (id: string): GoalMonth => ({ id, goal_id: 'g-1', user_id: 'user-1', title: `月计划 ${id}`, month: '2026-06-01' })
const goalDay = (id: string): GoalDay => ({ id, user_id: 'user-1', title: `日计划 ${id}`, status: 'active', day: '2026-06-12' })
const category = (id: string): GoalCategory => ({ id, user_id: 'user-1', name: `分类 ${id}` })

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
  })

  it('reset 清空所有缓存和状态', () => {
    const store = useGoalDataStore()

    store.goals = [goal('g-1')]
    store.goalMonths = [goalMonth('gm-1')]
    store.goalMonthsCache['g-1'] = [goalMonth('gm-1')]
    store.goalDaysCache['gm-1'] = [goalDay('gd-1')]
    store.archiveVersion = 5
    store.categories = [category('c-1')]
    store.initialized = true

    store.reset()

    expect(store.goals).toEqual([])
    expect(store.goalMonths).toEqual([])
    expect(Object.keys(store.goalMonthsCache)).toHaveLength(0)
    expect(Object.keys(store.goalDaysCache)).toHaveLength(0)
    expect(store.archiveVersion).toBe(0)
    expect(store.categories).toEqual([])
    expect(store.initialized).toBe(false)
  })

  it('clearGoalDaysCache 清空日计划缓存', () => {
    const store = useGoalDataStore()
    store.goalDaysCache['gm-1'] = [goalDay('gd-1')]
    store.goalDaysCache['gm-2'] = [goalDay('gd-2')]

    store.clearGoalDaysCache()

    expect(Object.keys(store.goalDaysCache)).toHaveLength(0)
  })

  it('clearGoalDaysCache(keepMonthPlanId) 保留指定缓存', () => {
    const store = useGoalDataStore()
    const data1 = [goalDay('gd-1')]
    const data2 = [goalDay('gd-2')]
    store.goalDaysCache['gm-1'] = data1
    store.goalDaysCache['gm-2'] = data2

    store.clearGoalDaysCache('gm-1')

    expect(Object.keys(store.goalDaysCache)).toHaveLength(1)
    expect(store.goalDaysCache['gm-1']).toEqual(data1)
  })

  it('getGoalMonthsByGoalId 返回缓存数据或空数组', () => {
    const store = useGoalDataStore()
    const cached = [goalMonth('gm-1')]
    store.goalMonthsCache['g-1'] = cached

    expect(store.getGoalMonthsByGoalId('g-1')).toEqual(cached)
    expect(store.getGoalMonthsByGoalId('nonexistent')).toEqual([])
  })
})
