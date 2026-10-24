import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { db } from '@/services/database'
import type { Mock } from 'vitest'

const loadGoalMonthsMock: Mock = vi.fn()
const fetchDataMock: Mock = vi.fn()

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ userId: 'user-1' })
}))

vi.mock('@/views/direction/composables/useDirectionFetch', () => ({
  useDirectionFetch: () => ({
    fetchData: fetchDataMock,
    loadGoalMonths: loadGoalMonthsMock
  })
}))

vi.mock('@/services/database', () => ({
  db: {
    goal: {
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn()
    },
    goalMonths: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
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
  ;(db.goal.create as Mock).mockResolvedValue({ id: 'p-new' })
  ;(db.goalMonths.create as Mock).mockResolvedValue({})
  ;(db.goalMonths.update as Mock).mockResolvedValue({})
  dataStore.reset()
  selectionStore.reset()
  batchStore.reset()
})

describe('useDirectionGoals', () => {
  it('loads monthly plans before deriving editable month bounds from date-only strings', async () => {
    const { handleEditGoal } = useDirectionGoals()

    await handleEditGoal({
      goal_id: 'p1',
      title: '目标',
      startMonth: 1,
      endMonth: 12
    })

    expect(loadGoalMonthsMock).toHaveBeenCalledWith('p1')
  })

  it('derives editable month bounds from date-only monthly plan strings', async () => {
    dataStore.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01' },
      { id: 'mp-2', goal_id: 'p1', month: '2026-07-01' }
    ]

    const { handleEditGoal } = useDirectionGoals()

    await handleEditGoal({
      goal_id: 'p1',
      title: '目标',
      startMonth: 1,
      endMonth: 12
    })

    expect(selectionStore.editingGoal.startMonth).toBe(4)
    expect(selectionStore.editingGoal.endMonth).toBe(7)
  })

  it('uses date-only month values when saving monthly plans', async () => {
    ;(db.goalMonths.update as Mock).mockResolvedValue({})

    dataStore.goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01' }
    ]
    selectionStore.selectedGoal = { goal_id: 'p1' }
    selectionStore.selectedMonth = 4

    const { saveMonthlyPlan } = useDirectionGoals()
    await saveMonthlyPlan(4, { title: '更新标题' })

    expect(db.goalMonths.update).toHaveBeenCalledWith('mp-1', {
      title: '更新标题'
    })
  })

  it('writes goal time into created monthly plans when adding a goal', async () => {
    const { handleAddGoal } = useDirectionGoals()

    await handleAddGoal({
      title: '读书',
      description: '',
      startMonth: 4,
      endMonth: 5,
      category_id: null,
      task_time: '07:30',
      duration: 45
    })

    expect(db.goal.create).toHaveBeenCalledWith(expect.objectContaining({
      task_time: '07:30',
      duration: 45
    }))
    expect(db.goalMonths.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      goal_id: 'p-new',
      month: expect.stringMatching(/-04-01$/),
      task_time: '07:30',
      duration: 45
    }))
    expect(db.goalMonths.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      goal_id: 'p-new',
      month: expect.stringMatching(/-05-01$/),
      task_time: '07:30',
      duration: 45
    }))
  })

  it('writes carry-over lookback days into created plans when adding a goal', async () => {
    const { handleAddGoal } = useDirectionGoals()

    await handleAddGoal({
      title: '读书',
      description: '',
      startMonth: 4,
      endMonth: 4,
      category_id: null,
      task_time: '07:30',
      duration: 45,
      carry_over_lookback_days: 3
    })

    expect(db.goal.create).toHaveBeenCalledWith(expect.objectContaining({
      carry_over_lookback_days: 3
    }))
  })

  it('refreshes direction data after adding a goal', async () => {
    const { handleAddGoal } = useDirectionGoals()

    await handleAddGoal({
      title: '新目标',
      startMonth: 4,
      endMonth: 4,
      category_id: null,
      task_time: '09:00',
      duration: 30
    })

    expect(loadGoalMonthsMock).toHaveBeenCalledWith('p-new')
    expect(fetchDataMock).toHaveBeenCalled()
  })

  it('writes goal time into missing monthly plans when expanding a goal range', async () => {
    dataStore.goalMonthsCache.p1 = [
      { id: 'mp-4', goal_id: 'p1', month: '2026-04-01', task_time: '08:00', duration: 30 }
    ]
    selectionStore.selectedGoal = {
      goal_id: 'p1',
      title: '读书',
      task_time: '08:00',
      duration: 30,
      startMonth: 4,
      endMonth: 4
    }

    const { handleConfirmRange } = useDirectionGoals()

    await handleConfirmRange({ start: 4, end: 5 })

    expect(db.goalMonths.create).toHaveBeenCalledWith(expect.objectContaining({
      goal_id: 'p1',
      month: expect.stringMatching(/-05-01$/),
      task_time: '08:00',
      duration: 30
    }))
  })

  it('writes carry-over lookback days into updated plans when editing a goal', async () => {
    selectionStore.editingGoal = {
      goal_id: 'p1',
      title: '目标',
      carry_over_lookback_days: 0
    }

    const { handleUpdateGoal } = useDirectionGoals()

    await handleUpdateGoal({
      title: '目标',
      category_id: null,
      task_time: '09:00',
      duration: 30,
      carry_over_lookback_days: 5
    })

    expect(db.goal.update).toHaveBeenCalledWith('p1', expect.objectContaining({
      carry_over_lookback_days: 5
    }))
  })
})
