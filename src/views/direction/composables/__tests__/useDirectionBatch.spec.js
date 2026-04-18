import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDirectionBatch } from '@/views/direction/composables/useDirectionBatch'
import {
  batchInput,
  dailyPlansCache,
  monthlyPlansCache,
  selectedDates,
  selectedGoal,
  selectedMonth
} from '@/views/direction/composables/useDirectionState'
import { safeDb } from '@/services/safeDb'

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

vi.mock('@/services/safeDb', () => ({
  safeDb: {
    rpc: vi.fn(),
    dailyPlans: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

beforeEach(() => {
  vi.clearAllMocks()

  batchInput.value = ''
  selectedGoal.value = null
  selectedMonth.value = null

  for (const key of Object.keys(monthlyPlansCache)) {
    delete monthlyPlansCache[key]
  }

  for (const key of Object.keys(dailyPlansCache)) {
    delete dailyPlansCache[key]
  }

  for (const key of Object.keys(selectedDates)) {
    delete selectedDates[key]
  }

  hasTaskDays = new Set([1])
})

describe('useDirectionBatch', () => {
  it('upserts daily plans through CRUD instead of RPC', async () => {
    safeDb.dailyPlans.update.mockResolvedValue({ id: 'dp-1' })

    monthlyPlansCache.p1 = [
      { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
    ]
    dailyPlansCache['mp-1'] = [
      { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' }
    ]
    selectedGoal.value = { plan_id: 'p1' }
    selectedMonth.value = 4
    selectedDates[4] = [1]
    batchInput.value = '新标题'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(safeDb.rpc).not.toHaveBeenCalled()
    expect(safeDb.dailyPlans.update).toHaveBeenCalledWith('dp-1', {
      title: '新标题',
      task_time: null,
      duration: null
    })
    expect(safeDb.dailyPlans.create).not.toHaveBeenCalled()
    expect(selectedDates[4]).toEqual([])
    expect(batchInput.value).toBe('')
  })

  it('creates missing daily plans through CRUD instead of RPC', async () => {
    safeDb.dailyPlans.create.mockResolvedValue({ id: 'dp-new' })
    hasTaskDays = new Set()

    monthlyPlansCache.p1 = [
      { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
    ]
      selectedGoal.value = { plan_id: 'p1' }
      selectedMonth.value = 4
    selectedDates[4] = [1, 2]
    batchInput.value = '批量新增'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(safeDb.rpc).not.toHaveBeenCalled()
    expect(safeDb.dailyPlans.create).toHaveBeenNthCalledWith(1, {
      monthly_plan_id: 'mp-1',
      user_id: 'user-1',
      day: '2026-04-01',
      title: '批量新增',
      task_time: null,
      duration: null
    })
    expect(safeDb.dailyPlans.create).toHaveBeenNthCalledWith(2, {
      monthly_plan_id: 'mp-1',
      user_id: 'user-1',
      day: '2026-04-02',
      title: '批量新增',
      task_time: null,
      duration: null
    })
  })

  it('deletes selected daily plans through CRUD instead of RPC', async () => {
    safeDb.dailyPlans.delete.mockResolvedValue({ id: 'dp-1' })

    monthlyPlansCache.p1 = [
      { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
    ]
    dailyPlansCache['mp-1'] = [
      { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' },
      { id: 'dp-2', monthly_plan_id: 'mp-1', day: '2026-04-02' }
    ]
    selectedGoal.value = { plan_id: 'p1' }
    selectedMonth.value = 4
    selectedDates[4] = [1, 2]

    const { handleBatchDelete } = useDirectionBatch()
    await handleBatchDelete()

    expect(safeDb.rpc).not.toHaveBeenCalled()
    expect(safeDb.dailyPlans.delete).toHaveBeenNthCalledWith(1, 'dp-1')
    expect(safeDb.dailyPlans.delete).toHaveBeenNthCalledWith(2, 'dp-2')
  })
})
