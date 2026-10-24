import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import type { GoalDay } from '@/services/db/goalDays'
import type { GoalMonth } from '@/services/db/goalMonths'

const goalMonth: GoalMonth = {
  id: 'gm-1',
  goal_id: 'goal-1',
  user_id: 'user-1',
  title: '月计划',
  month: '2026-06-01'
}

const goalDay: GoalDay = {
  id: 'gd-1',
  user_id: 'user-1',
  title: '日计划',
  status: 'active',
  day: '2026-06-12'
}

describe('goalBatchStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态为空', () => {
    const store = useGoalBatchStore()
    expect(Object.keys(store.goalMonthsMap)).toHaveLength(0)
    expect(Object.keys(store.dailyTasks)).toHaveLength(0)
    expect(Object.keys(store.selectedDates)).toHaveLength(0)
    expect(store.batchInput).toBe('')
  })

  it('添加数据后 reset 可清空所有缓存', () => {
    const store = useGoalBatchStore()

    store.goalMonthsMap['goal-1-6'] = goalMonth
    store.dailyTasks['goal-1-6-1'] = goalDay
    store.selectedDates['2026-06'] = [1, 2, 3]
    store.batchInput = '测试输入'

    expect(Object.keys(store.goalMonthsMap)).toHaveLength(1)
    expect(Object.keys(store.dailyTasks)).toHaveLength(1)
    expect(Object.keys(store.selectedDates)).toHaveLength(1)
    expect(store.batchInput).toBe('测试输入')

    store.reset()

    expect(Object.keys(store.goalMonthsMap)).toHaveLength(0)
    expect(Object.keys(store.dailyTasks)).toHaveLength(0)
    expect(Object.keys(store.selectedDates)).toHaveLength(0)
    expect(store.batchInput).toBe('')
  })
})
