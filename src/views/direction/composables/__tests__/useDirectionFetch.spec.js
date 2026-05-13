import { describe, expect, it, vi, beforeEach } from 'vitest'
import { parseDateOnly, useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import {
  dailyPlansCache,
  dailyTasks,
  editingGoal,
  initialized,
  monthlyMainGoals,
  monthlyPlans,
  monthlyPlansCache,
  plans,
  selectedGoal,
  selectedMonth,
  showAddModal
} from '@/views/direction/composables/useDirectionState'
import { db } from '@/services/database'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')

  return {
    ...actual,
    onMounted: vi.fn(),
    watch: vi.fn()
  }
})

vi.mock('@/services/database', () => ({
  db: {
    goal: {
      list: vi.fn()
    },
    goalMonths: {
      list: vi.fn()
    },
    goalDays: {
      list: vi.fn()
    }
  }
}))

beforeEach(() => {
  vi.clearAllMocks()

  plans.value = []
  monthlyPlans.value = []
  selectedGoal.value = null
  selectedMonth.value = null
  editingGoal.value = null
  initialized.value = false
  showAddModal.value = false

  for (const key of Object.keys(monthlyPlansCache)) {
    delete monthlyPlansCache[key]
  }

  for (const key of Object.keys(dailyPlansCache)) {
    delete dailyPlansCache[key]
  }

  for (const key of Object.keys(monthlyMainGoals)) {
    delete monthlyMainGoals[key]
  }

  for (const key of Object.keys(dailyTasks)) {
    delete dailyTasks[key]
  }
})

describe('useDirectionFetch', () => {
  it('parses database date strings as local date-only values', () => {
    const parsed = parseDateOnly('2026-04-01')

    expect(parsed).not.toBeNull()
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(3)
    expect(parsed.getDate()).toBe(1)
  })

  it('builds monthly and daily keys from date-only database fields', async () => {
    db.goal.list.mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    db.goalMonths.list.mockResolvedValue([
      { id: 'mp1', plan_id: 'p1', month: '2026-04-01' }
    ])
    db.goalDays.list.mockResolvedValue([
      { id: 'dp1', monthly_plan_id: 'mp1', day: '2026-04-30' }
    ])

    const { fetchData } = useDirectionFetch()

    await fetchData()

    expect(monthlyMainGoals['plan-p1-4']).toEqual({
      id: 'mp1',
      plan_id: 'p1',
      month: '2026-04-01'
    })
    expect(dailyTasks['plan-p1-4-30']).toEqual({
      id: 'dp1',
      monthly_plan_id: 'mp1',
      day: '2026-04-30'
    })
  })

  it('loads monthly plans only for the default selected goal during initial fetch', async () => {
    db.goal.list.mockResolvedValue([
      { id: 'p1', title: '目标 1' },
      { id: 'p2', title: '目标 2' }
    ])
    db.goalMonths.list.mockResolvedValue([
      { id: 'mp1', plan_id: 'p1', month: '2026-04-01' }
    ])
    db.goalDays.list.mockResolvedValue([])

    const { fetchData } = useDirectionFetch()
    await fetchData()

    expect(db.goalMonths.list).toHaveBeenCalledTimes(1)
    expect(db.goalMonths.list).toHaveBeenCalledWith('p1')
    expect(db.goalMonths.list).not.toHaveBeenCalledWith('p2')
  })

  it('loads daily plans only for the resolved default month during initial fetch', async () => {
    const currentMonth = new Date().getMonth() + 1
    const currentMonthDate = `2026-${String(currentMonth).padStart(2, '0')}-01`
    const otherMonth = currentMonth === 1 ? 2 : 1
    const otherMonthDate = `2026-${String(otherMonth).padStart(2, '0')}-01`

    db.goal.list.mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    db.goalMonths.list.mockResolvedValue([
      { id: 'mp-other', plan_id: 'p1', month: otherMonthDate },
      { id: 'mp-current', plan_id: 'p1', month: currentMonthDate }
    ])
    db.goalDays.list.mockResolvedValue([])

    const { fetchData } = useDirectionFetch()
    await fetchData()

    expect(db.goalDays.list).toHaveBeenCalledTimes(1)
    expect(db.goalDays.list).toHaveBeenCalledWith('mp-current')
    expect(db.goalDays.list).not.toHaveBeenCalledWith('mp-other')
  })

  it('selects the current month during initial fetch when the current month exists', async () => {
    const currentMonth = new Date().getMonth() + 1
    const currentMonthDate = `2026-${String(currentMonth).padStart(2, '0')}-01`
    const fallbackMonthDate = currentMonth === 1 ? '2026-02-01' : '2026-01-01'

    db.goal.list.mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    db.goalMonths.list.mockResolvedValue([
      { id: 'mp-fallback', plan_id: 'p1', month: fallbackMonthDate },
      { id: 'mp-current', plan_id: 'p1', month: currentMonthDate }
    ])
    db.goalDays.list.mockResolvedValue([])

    const { fetchData } = useDirectionFetch()

    await fetchData()

    expect(selectedMonth.value).toBe(currentMonth)
    expect(db.goalDays.list).toHaveBeenCalledWith('mp-current')
  })

  it('falls back to the first available month during initial fetch when the current month is missing', async () => {
    const currentMonth = new Date().getMonth() + 1
    const firstMonth = currentMonth === 3 ? 4 : 3
    const laterMonth = currentMonth === 7 ? 8 : 7
    const firstMonthDate = `2026-${String(firstMonth).padStart(2, '0')}-01`
    const laterMonthDate = `2026-${String(laterMonth).padStart(2, '0')}-01`

    db.goal.list.mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    db.goalMonths.list.mockResolvedValue([
      { id: 'mp-later', plan_id: 'p1', month: laterMonthDate },
      { id: 'mp-first', plan_id: 'p1', month: firstMonthDate }
    ])
    db.goalDays.list.mockResolvedValue([])

    const { fetchData } = useDirectionFetch()

    await fetchData()

    expect(selectedMonth.value).toBe(firstMonth)
    expect(db.goalDays.list).toHaveBeenCalledWith('mp-first')
  })
})
