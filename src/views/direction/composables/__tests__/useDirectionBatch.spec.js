import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDirectionBatch } from '@/views/direction/composables/useDirectionBatch'
import { useDirectionStore } from '@/stores/directionStore'
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
    loadGoalDays: vi.fn()
  })
}))

vi.mock('@/services/database', () => ({
  db: {
    rpc: vi.fn(),
    goalDays: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByIds: vi.fn()
    }
  }
}))

let store

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  store = useDirectionStore()
  store.reset()

  hasTaskDays = new Set([1])
})

describe('useDirectionBatch', () => {
  it('upserts daily plans through CRUD instead of RPC', async () => {
    db.goalDays.update.mockResolvedValue({ id: 'dp-1' })

    store.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: '09:45', duration: 25 }
    ]
    store.goalDaysCache['mp-1'] = [
      { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' }
    ]
    store.selectedGoal = { goal_id: 'p1' }
    store.selectedMonth = 4
    store.selectedDates[4] = [1]
    store.batchInput = '新标题'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.goalDays.update).toHaveBeenCalledWith('dp-1', {
      title: '新标题',
      task_time: '09:45',
      duration: 25
    })
    expect(db.goalDays.create).not.toHaveBeenCalled()
    expect(store.selectedDates[4]).toEqual([])
    expect(store.batchInput).toBe('')
  })

  it('creates missing daily plans through CRUD instead of RPC', async () => {
    db.goalDays.create.mockResolvedValue({ id: 'dp-new' })
    hasTaskDays = new Set()

    store.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: '10:15', duration: 50 }
    ]
    store.selectedGoal = { goal_id: 'p1' }
    store.selectedMonth = 4
    store.selectedDates[4] = [1, 2]
    store.batchInput = '批量新增'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.goalDays.create).toHaveBeenNthCalledWith(1, {
      goal_month_id: 'mp-1',
      user_id: 'user-1',
      day: '2026-04-01',
      title: '批量新增',
      task_time: '10:15',
      duration: 50
    })
    expect(db.goalDays.create).toHaveBeenNthCalledWith(2, {
      goal_month_id: 'mp-1',
      user_id: 'user-1',
      day: '2026-04-02',
      title: '批量新增',
      task_time: '10:15',
      duration: 50
    })
  })

  it('falls back to selected goal time when current monthly plan has no time', async () => {
    db.goalDays.create.mockResolvedValue({ id: 'dp-new' })
    hasTaskDays = new Set()

    store.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: null, duration: null }
    ]
    store.selectedGoal = { goal_id: 'p1', task_time: '06:30', duration: 40 }
    store.selectedMonth = 4
    store.selectedDates[4] = [3]
    store.batchInput = '晨读'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(db.goalDays.create).toHaveBeenCalledWith(expect.objectContaining({
      day: '2026-04-03',
      title: '晨读',
      task_time: '06:30',
      duration: 40
    }))
  })

  it('deletes selected daily plans in one bulk request instead of one by one', async () => {
    db.goalDays.deleteByIds.mockResolvedValue({})

    store.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01' }
    ]
    store.goalDaysCache['mp-1'] = [
      { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' },
      { id: 'dp-2', monthly_plan_id: 'mp-1', day: '2026-04-02' }
    ]
    store.selectedGoal = { goal_id: 'p1' }
    store.selectedMonth = 4
    store.selectedDates[4] = [1, 2]

    const { handleBatchDelete } = useDirectionBatch()
    await handleBatchDelete()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.goalDays.deleteByIds).toHaveBeenCalledWith(['dp-1', 'dp-2'])
    expect(db.goalDays.delete).not.toHaveBeenCalled()
  })
})
