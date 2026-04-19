import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDirectionStore } from '@/stores/directionStore'
import { useDirectionBatch } from '@/views/direction/composables/useDirectionBatch'
import { db } from '@/services/database'

let hasTaskDays = new Set([1])

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ userId: 'user-1' })
}))

vi.mock('@/views/direction/composables/useDirectionSelection', () => ({
  useDirectionSelection: () => ({
    hasTask: (month, day) => hasTaskDays.has(day),
    dayTaskKey: () => ''
  })
}))

vi.mock('@/views/direction/composables/useDirectionFetch', () => ({
  useDirectionFetch: () => ({
    loadDailyPlans: vi.fn()
  })
}))

vi.mock('@/services/database', () => ({
  db: {
    rpc: vi.fn(),
    dailyPlans: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({})
    }
  }
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()

  const store = useDirectionStore()
  store.reset()
  // Initialize plans so fetchData works properly
  store.plans = [{ id: 'p1', title: '目标 1' }]

  hasTaskDays = new Set([1])
})

describe('useDirectionBatch', () => {
  it('upserts daily plans through CRUD instead of RPC', async () => {
    const store = useDirectionStore()
    db.dailyPlans.update.mockResolvedValue({ id: 'dp-1' })

    Object.assign(store.monthlyPlansCache, {
      p1: [
        { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
      ]
    })
    Object.assign(store.dailyPlansCache, {
      'mp-1': [
        { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' }
      ]
    })
    store.selectedGoal = { plan_id: 'p1' }
    store.selectedMonth = 4
    store.selectedDates[4] = [1]
    store.batchInput = '新标题'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.dailyPlans.update).toHaveBeenCalledWith('dp-1', {
      title: '新标题',
      task_time: null,
      duration: null
    })
    expect(db.dailyPlans.create).not.toHaveBeenCalled()
    expect(store.selectedDates[4]).toEqual([])
    expect(store.batchInput).toBe('')
  })

  it('creates missing daily plans through CRUD instead of RPC', async () => {
    const store = useDirectionStore()
    db.dailyPlans.create.mockResolvedValue({ id: 'dp-new' })
    hasTaskDays = new Set()

    Object.assign(store.monthlyPlansCache, {
      p1: [
        { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
      ]
    })
    store.selectedGoal = { plan_id: 'p1' }
    store.selectedMonth = 4
    store.selectedDates[4] = [1, 2]
    store.batchInput = '批量新增'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.dailyPlans.create).toHaveBeenNthCalledWith(1, {
      monthly_plan_id: 'mp-1',
      user_id: 'user-1',
      day: '2026-04-01',
      title: '批量新增',
      task_time: null,
      duration: null
    })
    expect(db.dailyPlans.create).toHaveBeenNthCalledWith(2, {
      monthly_plan_id: 'mp-1',
      user_id: 'user-1',
      day: '2026-04-02',
      title: '批量新增',
      task_time: null,
      duration: null
    })
  })

  it('deletes selected daily plans through CRUD instead of RPC', async () => {
    const store = useDirectionStore()
    db.dailyPlans.delete.mockResolvedValue({ id: 'dp-1' })

    Object.assign(store.monthlyPlansCache, {
      p1: [
        { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
      ]
    })
    Object.assign(store.dailyPlansCache, {
      'mp-1': [
        { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' },
        { id: 'dp-2', monthly_plan_id: 'mp-1', day: '2026-04-02' }
      ]
    })
    store.selectedGoal = { plan_id: 'p1' }
    store.selectedMonth = 4
    store.selectedDates[4] = [1, 2]

    const { handleBatchDelete } = useDirectionBatch()
    await handleBatchDelete()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.dailyPlans.delete).toHaveBeenNthCalledWith(1, 'dp-1')
    expect(db.dailyPlans.delete).toHaveBeenNthCalledWith(2, 'dp-2')
  })
})
