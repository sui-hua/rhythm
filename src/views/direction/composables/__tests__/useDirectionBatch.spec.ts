import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDirectionBatch } from '@/views/direction/composables/useDirectionBatch'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { db } from '@/services/database'
import type { Mock } from 'vitest'

let hasTaskDays: Set<number> = new Set([1])

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ userId: 'user-1' })
}))

vi.mock('@/views/direction/composables/useDirectionSelection', () => ({
  useDirectionSelection: () => ({
    hasTask: (month: number, day: number) => hasTaskDays.has(day),
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

let dataStore: ReturnType<typeof useGoalDataStore>
let selectionStore: ReturnType<typeof useGoalSelectionStore>
let batchStore: ReturnType<typeof useGoalBatchStore>

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  dataStore = useGoalDataStore()
  selectionStore = useGoalSelectionStore()
  batchStore = useGoalBatchStore()
  dataStore.reset()
  selectionStore.reset()
  batchStore.reset()

  hasTaskDays = new Set([1])
})

describe('useDirectionBatch', () => {
  it('upserts daily plans through CRUD instead of RPC', async () => {
    ;(db.goalDays.update as Mock).mockResolvedValue({ id: 'dp-1' })

    dataStore.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: '09:45', duration: 25 }
    ]
    dataStore.goalDaysCache['mp-1'] = [
      { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' }
    ]
    selectionStore.selectedGoal = { id: 'p1', goal_id: 'p1', title: '目标 1', name: '目标 1', category_name: '未分类' }
    selectionStore.selectedMonth = 4
    batchStore.selectedDates[4] = [1]
    batchStore.batchInput = '新标题'

    const { applyBatchTask } = useDirectionBatch()
    await applyBatchTask()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.goalDays.update).toHaveBeenCalledWith('dp-1', {
      title: '新标题',
      task_time: '09:45',
      duration: 25
    })
    expect(db.goalDays.create).not.toHaveBeenCalled()
    expect(batchStore.selectedDates[4]).toEqual([])
    expect(batchStore.batchInput).toBe('')
  })

  it('creates missing daily plans through CRUD instead of RPC', async () => {
    ;(db.goalDays.create as Mock).mockResolvedValue({ id: 'dp-new' })
    hasTaskDays = new Set()

    dataStore.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: '10:15', duration: 50 }
    ]
    selectionStore.selectedGoal = { id: 'p1', goal_id: 'p1', title: '目标 1', name: '目标 1', category_name: '未分类' }
    selectionStore.selectedMonth = 4
    batchStore.selectedDates[4] = [1, 2]
    batchStore.batchInput = '批量新增'

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
    ;(db.goalDays.create as Mock).mockResolvedValue({ id: 'dp-new' })
    hasTaskDays = new Set()

    dataStore.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01', task_time: null, duration: null }
    ]
    selectionStore.selectedGoal = { id: 'p1', goal_id: 'p1', title: '目标 1', name: '目标 1', category_name: '未分类', task_time: '06:30', duration: 40 }
    selectionStore.selectedMonth = 4
    batchStore.selectedDates[4] = [3]
    batchStore.batchInput = '晨读'

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
    ;(db.goalDays.deleteByIds as Mock).mockResolvedValue({})

    dataStore.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01' }
    ]
    dataStore.goalDaysCache['mp-1'] = [
      { id: 'dp-1', monthly_plan_id: 'mp-1', day: '2026-04-01' },
      { id: 'dp-2', monthly_plan_id: 'mp-1', day: '2026-04-02' }
    ]
    selectionStore.selectedGoal = { id: 'p1', goal_id: 'p1', title: '目标 1', name: '目标 1', category_name: '未分类' }
    selectionStore.selectedMonth = 4
    batchStore.selectedDates[4] = [1, 2]

    const { handleBatchDelete } = useDirectionBatch()
    await handleBatchDelete()

    expect(db.rpc).not.toHaveBeenCalled()
    expect(db.goalDays.deleteByIds).toHaveBeenCalledWith(['dp-1', 'dp-2'])
    expect(db.goalDays.delete).not.toHaveBeenCalled()
  })
})
