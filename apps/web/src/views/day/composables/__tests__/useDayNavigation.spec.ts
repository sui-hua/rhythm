import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')

  return {
    ...actual,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
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

vi.mock('@/stores/dayStore', () => ({
  useDayStore: vi.fn()
}))

vi.mock('@/views/day/composables/useDailyReport', () => ({
  useDailyReport: vi.fn()
}))

vi.mock('@/views/day/utils/getInitialScrollTarget', () => ({
  getInitialScrollTarget: vi.fn()
}))

import { nextTick, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDateStore } from '@/stores/dateStore'
import { useDayStore } from '@/stores/dayStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { getInitialScrollTarget } from '@/views/day/utils/getInitialScrollTarget'
import { useDayNavigation } from '@/views/day/composables/useDayNavigation'

// 使用 vi.mocked 获取类型安全的 mock 引用
const mockOnMounted = vi.mocked(onMounted)
const mockWatch = vi.mocked(watch)
const mockUseRoute = vi.mocked(useRoute)
const mockUseRouter = vi.mocked(useRouter)
const mockUseDateStore = vi.mocked(useDateStore)
const mockUseDayStore = vi.mocked(useDayStore)
const mockUseDailyReport = vi.mocked(useDailyReport)
const mockGetInitialScrollTarget = vi.mocked(getInitialScrollTarget)

describe('useDayNavigation', () => {
  const route: { params: Record<string, string> } = {
    params: {
      year: 'abc',
      month: '4',
      day: '5'
    }
  }

  const router = {
    replace: vi.fn() as Mock,
    push: vi.fn() as Mock
  }

  const dateStore = {
    currentDate: new Date(2025, 0, 1),
    setYearMonthDay: vi.fn() as Mock
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseRoute.mockReturnValue(route)
    mockUseRouter.mockReturnValue(router)
    mockUseDateStore.mockReturnValue(dateStore)
    mockUseDayStore.mockReturnValue({
      dailySchedule: [],
      fetchTasks: vi.fn(),
      isLoading: false
    })
    mockUseDailyReport.mockReturnValue({
      openIfNeeded: vi.fn()
    })
    mockGetInitialScrollTarget.mockReturnValue({
      type: 'default-hour',
      hour: 8
    })
  })

  it('year 非法时仍会保留 day 路由里的 month/day 意图', () => {
    const { validateDayRoute } = useDayNavigation()

    expect(mockOnMounted).toHaveBeenCalledTimes(1)
    expect(mockWatch).toHaveBeenCalledTimes(1)

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

  it('传入日报实例时复用该实例，避免导航和页面弹窗状态分离', () => {
    const dailyReport = {
      openIfNeeded: vi.fn()
    }

    useDayNavigation({ dailyReport })

    expect(mockUseDailyReport).not.toHaveBeenCalled()
  })

  it('首次挂载时将滚动目标委托给 getInitialScrollTarget', async () => {
    const fetchTasks = vi.fn()
    const openIfNeeded = vi.fn()
    const scrollIntoView = vi.fn()
    const mountedCallbacks: Array<() => Promise<void>> = []

    route.params = {
      year: '2026',
      month: '4',
      day: '19'
    }

    mockUseDayStore.mockReturnValue({
      dailySchedule: [
        { startHour: 9, durationHours: 1, completed: false }
      ],
      fetchTasks,
      isLoading: false
    })
    mockUseDailyReport.mockReturnValue({
      openIfNeeded
    })
    mockOnMounted.mockImplementation((cb: () => Promise<void>) => {
      mountedCallbacks.push(cb)
    })

    // Node 环境下没有 document，需要直接挂载到 globalThis
    const globalObj = globalThis as Record<string, unknown>
    globalObj.document = {
      getElementById: vi.fn(() => ({
        scrollIntoView
      }))
    }
    globalObj.requestAnimationFrame = vi.fn((cb: () => void) => cb())
    globalObj.setTimeout = vi.fn((cb: () => void) => {
      cb()
      return 1
    })
    globalObj.setInterval = vi.fn(() => 1)

    useDayNavigation()

    expect(mountedCallbacks).toHaveLength(1)

    await mountedCallbacks[0]()
    await nextTick()

    expect(mockGetInitialScrollTarget).toHaveBeenCalledWith(expect.objectContaining({
      schedule: [
        { startHour: 9, durationHours: 1, completed: false }
      ],
      targetDate: expect.any(Date),
      now: expect.any(Date)
    }))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })
  })
})
