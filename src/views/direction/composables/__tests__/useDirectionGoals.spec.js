import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import {
  editingGoal,
  monthlyPlansCache,
  selectedGoal,
  selectedMonth
} from '@/views/direction/composables/useDirectionState'
import { db } from '@/services/database'

const loadMonthlyPlansMock = vi.fn()

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ userId: 'user-1' })
}))

vi.mock('@/views/direction/composables/useDirectionFetch', () => ({
  useDirectionFetch: () => ({
    fetchData: vi.fn(),
    loadMonthlyPlans: loadMonthlyPlansMock
  })
}))

vi.mock('@/services/database', () => ({
  db: {
    plans: {
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn()
    },
    monthlyPlans: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

beforeEach(() => {
  vi.clearAllMocks()
  editingGoal.value = null
  selectedGoal.value = null
  selectedMonth.value = null

  for (const key of Object.keys(monthlyPlansCache)) {
    delete monthlyPlansCache[key]
  }
})

describe('useDirectionGoals', () => {
  it('loads monthly plans before deriving editable month bounds from date-only strings', async () => {
    const { handleEditGoal } = useDirectionGoals()

    await handleEditGoal({
      plan_id: 'p1',
      title: '目标',
      startMonth: 1,
      endMonth: 12
    })

    expect(loadMonthlyPlansMock).toHaveBeenCalledWith('p1')
  })

  it('derives editable month bounds from date-only monthly plan strings', async () => {
    monthlyPlansCache.p1 = [
      { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' },
      { id: 'mp-2', plan_id: 'p1', month: '2026-07-01' }
    ]

    const { handleEditGoal } = useDirectionGoals()

    await handleEditGoal({
      plan_id: 'p1',
      title: '目标',
      startMonth: 1,
      endMonth: 12
    })

    expect(editingGoal.value.startMonth).toBe(4)
    expect(editingGoal.value.endMonth).toBe(7)
  })

  it('uses date-only month values when saving monthly plans', async () => {
    db.monthlyPlans.update.mockResolvedValue({})

    monthlyPlansCache.p1 = [
      { id: 'mp-1', plan_id: 'p1', month: '2026-04-01' }
    ]
    selectedGoal.value = { plan_id: 'p1' }
    selectedMonth.value = 4

    const { saveMonthlyPlan } = useDirectionGoals()
    await saveMonthlyPlan(4, { title: '更新标题' })

    expect(db.monthlyPlans.update).toHaveBeenCalledWith('mp-1', {
      title: '更新标题'
    })
  })
})
