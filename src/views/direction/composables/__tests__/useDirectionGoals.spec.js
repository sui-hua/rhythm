import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import {
  editingGoal,
  goalMonthsCache,
  selectedGoal,
  selectedMonth
} from '@/views/direction/composables/useDirectionState'
import { db } from '@/services/database'

const loadGoalMonthsMock = vi.fn()
const fetchDataMock = vi.fn()

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

beforeEach(() => {
  vi.clearAllMocks()
  db.goal.create.mockResolvedValue({ id: 'p-new' })
  db.goalMonths.create.mockResolvedValue({})
  db.goalMonths.update.mockResolvedValue({})
  editingGoal.value = null
  selectedGoal.value = null
  selectedMonth.value = null

  for (const key of Object.keys(goalMonthsCache)) {
    delete goalMonthsCache[key]
  }
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
    goalMonthsCache.p1 = [
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

    expect(editingGoal.value.startMonth).toBe(4)
    expect(editingGoal.value.endMonth).toBe(7)
  })

  it('uses date-only month values when saving monthly plans', async () => {
    db.goalMonths.update.mockResolvedValue({})

    goalMonthsCache.p1 = [
      { id: 'mp-1', goal_id: 'p1', month: '2026-04-01' }
    ]
    selectedGoal.value = { goal_id: 'p1' }
    selectedMonth.value = 4

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
    goalMonthsCache.p1 = [
      { id: 'mp-4', goal_id: 'p1', month: '2026-04-01', task_time: '08:00', duration: 30 }
    ]
    selectedGoal.value = {
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
    editingGoal.value = {
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
