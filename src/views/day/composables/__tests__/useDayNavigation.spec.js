import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')

  return {
    ...actual,
    onMounted: vi.fn(),
    watch: vi.fn()
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

import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDateStore } from '@/stores/dateStore'
import { useDayData } from '@/views/day/composables/useDayData'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
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
  })

  it('year 非法时仍会保留 day 路由里的 month/day 意图', () => {
    const { validateDayRoute } = useDayNavigation()

    expect(onMounted).toHaveBeenCalledTimes(1)
    expect(watch).toHaveBeenCalledTimes(1)

    const result = validateDayRoute()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/day/2025/4/5')
  })
})
