import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')

  return {
    ...actual,
    onMounted: vi.fn(),
    watch: vi.fn(),
    nextTick: vi.fn(() => Promise.resolve())
  }
})

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn()
}))

vi.mock('@/stores/dateStore', () => ({
  useDateStore: vi.fn()
}))

vi.mock('@/views/day/composables/useDayData', () => ({
  useDayData: vi.fn()
}))

vi.mock('@/views/day/composables/useDailyReport', () => ({
  useDailyReport: vi.fn()
}))

vi.mock('@/views/day/composables/getInitialScrollTarget', () => ({
  getInitialScrollTarget: vi.fn()
}))

import { nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDateStore } from '@/stores/dateStore'
import { useDayData } from '@/views/day/composables/useDayData'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { getInitialScrollTarget } from '@/views/day/composables/getInitialScrollTarget'
import { useDayNavigation } from '@/views/day/composables/useDayNavigation'

describe('useDayNavigation', () => {
  const route = {
    params: {
      year: 'abc',
      month: '4',
      day: '5'
    }
  }

  const router = {
    replace: vi.fn(),
    push: vi.fn()
  }

  const dateStore = {
    currentDate: new Date(2025, 0, 1),
    setYearMonthDay: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()

    useRoute.mockReturnValue(route)
    useRouter.mockReturnValue(router)
    useDateStore.mockReturnValue(dateStore)
    useDayData.mockReturnValue({
      dailySchedule: { value: [] },
      fetchTasks: vi.fn(),
      isLoading: { value: false }
    })
    useDailyReport.mockReturnValue({
      openIfNeeded: vi.fn()
    })
    getInitialScrollTarget.mockReturnValue({
      type: 'default-hour',
      hour: 8
    })
  })

  it('year 非法时仍会保留 day 路由里的 month/day 意图', () => {
    const { validateDayRoute } = useDayNavigation()

    expect(onMounted).toHaveBeenCalledTimes(1)
    expect(watch).toHaveBeenCalledTimes(1)

    const result = validateDayRoute()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/day/2025/4/5')
  })

  it('缺少 year/month/day 参数时保留 /day 地址并使用当前日期', () => {
    route.params = {}

    const { validateDayRoute } = useDayNavigation()
    const result = validateDayRoute()

    expect(result).toBe(true)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('首次挂载时将滚动目标委托给 getInitialScrollTarget', async () => {
    const fetchTasks = vi.fn()
    const openIfNeeded = vi.fn()
    const scrollIntoView = vi.fn()
    const mountedCallbacks = []

    route.params = {
      year: '2026',
      month: '4',
      day: '19'
    }

    useDayData.mockReturnValue({
      dailySchedule: {
        value: [
          { startHour: 9, durationHours: 1, completed: false }
        ]
      },
      fetchTasks,
      isLoading: { value: false }
    })
    useDailyReport.mockReturnValue({
      openIfNeeded
    })
    onMounted.mockImplementation((cb) => {
      mountedCallbacks.push(cb)
    })
    global.document = {
      getElementById: vi.fn(() => ({
        scrollIntoView
      }))
    }
    global.requestAnimationFrame = vi.fn((cb) => cb())
    global.setTimeout = vi.fn((cb) => {
      cb()
      return 1
    })
    global.setInterval = vi.fn(() => 1)

    useDayNavigation()

    expect(mountedCallbacks).toHaveLength(1)

    await mountedCallbacks[0]()
    await nextTick()

    expect(getInitialScrollTarget).toHaveBeenCalledWith(expect.objectContaining({
      schedule: [
        { startHour: 9, durationHours: 1, completed: false }
      ],
      targetDate: expect.any(Date),
      now: expect.any(Date)
    }))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })
  })
})
