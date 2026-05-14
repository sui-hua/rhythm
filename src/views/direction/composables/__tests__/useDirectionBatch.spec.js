import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDirectionBatch } from '@/views/direction/composables/useDirectionBatch'
import {
  batchInput,
  goalDaysCache,
  goalMonthsCache,
  selectedDates,
  selectedGoal,
  selectedMonth
} from '@/views/direction/composables/useDirectionState'
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

beforeEach(() => {
  vi.clearAllMocks()

  batchInput.value = ''
  selectedGoal.value = null
  selectedMonth.value = null

  for (const key of Object.keys(goalMonthsCache)) {
    delete goalMonthsCache[key]
  }

  for (const key of Object.keys(goalDaysCache)) {
    delete goalDaysCache[key]
  }

  for (const key of Object.keys(selectedDates)) {
    delete selectedDates[key]
  }

  hasTaskDays = new Set([1])
})

describe('useDirectionBatch', () => {
  it('upserts daily plans through CRUD instead of RPC', async () => {
    db.goalDays.update.mockResolvedValue({ id: 'dp-1' })

    goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: '09:45', duration: 25 }
    ]
    goalDaysCache['mp-1'] = [
      { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' }
    ]
    selectedGoal.value = { goal_id: 'p1' }
    selectedMonth.value = 4
    selectedDates[4] = [1]
    batchInput.value = '新标题'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.goalDays.update).toHaveBeenCalledWith('dp-1', {
      title: '新标题',
      task_time: '09:45',
      duration: 25
    })
    expect(db.goalDays.create).not.toHaveBeenCalled()
    expect(selectedDates[4]).toEqual([])
    expect(batchInput.value).toBe('')
  })

  it('creates missing daily plans through CRUD instead of RPC', async () => {
    db.goalDays.create.mockResolvedValue({ id: 'dp-new' })
    hasTaskDays = new Set()

    goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: '10:15', duration: 50 }
    ]
      selectedGoal.value = { goal_id: 'p1' }
      selectedMonth.value = 4
    selectedDates[4] = [1, 2]
    batchInput.value = '批量新增'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.goalDays.create).toHaveBeenNthCalledWith(1, {
      monthly_plan_id: 'mp-1',
      user_id: 'user-1',
      day: '2026-04-01',
      title: '批量新增',
      task_time: '10:15',
      duration: 50
    })
    expect(db.goalDays.create).toHaveBeenNthCalledWith(2, {
      monthly_plan_id: 'mp-1',
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

    goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: null, duration: null }
    ]
    selectedGoal.value = { goal_id: 'p1', task_time: '06:30', duration: 40 }
    selectedMonth.value = 4
    selectedDates[4] = [3]
    batchInput.value = '晨读'

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

    goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01' }
    ]
    goalDaysCache['mp-1'] = [
      { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' },
      { id: 'dp-2', monthly_plan_id: 'mp-1', day: '2026-04-02' }
    ]
    selectedGoal.value = { goal_id: 'p1' }
    selectedMonth.value = 4
    selectedDates[4] = [1, 2]

    const { handleBatchDelete } = useDirectionBatch()
    await handleBatchDelete()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.goalDays.deleteByIds).toHaveBeenCalledWith(['dp-1', 'dp-2'])
    expect(db.goalDays.delete).not.toHaveBeenCalled()
  })
})
