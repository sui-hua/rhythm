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
  showAddModal
} from '@/views/direction/composables/useDirectionState'
import { safeDb } from '@/services/safeDb'

const flushMicrotasks = () => new Promise(resolve => setImmediate(resolve))

const createDeferred = () => {
  let resolve
  const promise = new Promise((res) => {
    resolve = res
  })

  return { promise, resolve }
}

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')

  return {
    ...actual,
    onMounted: vi.fn(),
    watch: vi.fn()
  }
})

vi.mock('@/services/safeDb', () => ({
  safeDb: {
    plans: {
      list: vi.fn()
    },
    monthlyPlans: {
      list: vi.fn()
    },
    dailyPlans: {
      list: vi.fn()
    }
  }
}))

beforeEach(() => {
  vi.clearAllMocks()

  plans.value = []
  monthlyPlans.value = []
  selectedGoal.value = null
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
    safeDb.plans.list.mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    safeDb.monthlyPlans.list.mockResolvedValue([
      { id: 'mp1', plan_id: 'p1', month: '2026-04-01' }
    ])
    safeDb.dailyPlans.list.mockResolvedValue([
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

  it('starts monthly plan requests for every plan before any monthly request resolves', async () => {
    const firstMonthly = createDeferred()
    const secondMonthly = createDeferred()

    safeDb.plans.list.mockResolvedValue([
      { id: 'p1', title: '目标 1' },
      { id: 'p2', title: '目标 2' }
    ])
    safeDb.monthlyPlans.list
      .mockImplementationOnce(() => firstMonthly.promise)
      .mockImplementationOnce(() => secondMonthly.promise)
    safeDb.dailyPlans.list.mockResolvedValue([])

    const { fetchData } = useDirectionFetch()
    const fetchPromise = fetchData()

    await flushMicrotasks()

    expect(safeDb.monthlyPlans.list).toHaveBeenCalledTimes(2)
    expect(safeDb.monthlyPlans.list).toHaveBeenNthCalledWith(1, 'p1')
    expect(safeDb.monthlyPlans.list).toHaveBeenNthCalledWith(2, 'p2')

    firstMonthly.resolve([])
    secondMonthly.resolve([])
    await fetchPromise
  })

  it('starts daily plan requests for every monthly plan before any daily request resolves', async () => {
    const firstDaily = createDeferred()
    const secondDaily = createDeferred()

    safeDb.plans.list.mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    safeDb.monthlyPlans.list.mockResolvedValue([
      { id: 'mp1', plan_id: 'p1', month: '2026-04-01' },
      { id: 'mp2', plan_id: 'p1', month: '2026-04-01' }
    ])
    safeDb.dailyPlans.list
      .mockImplementationOnce(() => firstDaily.promise)
      .mockImplementationOnce(() => secondDaily.promise)

    const { fetchData } = useDirectionFetch()
    const fetchPromise = fetchData()

    await flushMicrotasks()
    await flushMicrotasks()

    expect(safeDb.dailyPlans.list).toHaveBeenCalledTimes(2)
    expect(safeDb.dailyPlans.list).toHaveBeenNthCalledWith(1, 'mp1')
    expect(safeDb.dailyPlans.list).toHaveBeenNthCalledWith(2, 'mp2')

    firstDaily.resolve([])
    secondDaily.resolve([])
    await fetchPromise
  })
})
