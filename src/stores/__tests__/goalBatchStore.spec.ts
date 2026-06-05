import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGoalBatchStore } from '@/stores/goalBatchStore'

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

    store.goalMonthsMap['goal-1-6'] = { id: 'gm-1' } as any
    store.dailyTasks['goal-1-6-1'] = { id: 'gd-1' } as any
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
