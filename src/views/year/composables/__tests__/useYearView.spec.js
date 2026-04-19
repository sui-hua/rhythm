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

vi.mock('@/services/database', () => ({
  db: {
    habits: {
      list: vi.fn(),
      listLogsByYear: vi.fn()
    }
  }
}))

import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { useYearView } from '@/views/year/composables/useYearView'

describe('useYearView', () => {
  const route = {
    params: {
      year: '1'
    }
  }

  const router = {
    push: vi.fn(),
    replace: vi.fn()
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
    db.habits.list.mockResolvedValue([])
    db.habits.listLogsByYear.mockResolvedValue([])
  })

  it('0-99 的 year 路由会先规范化到 1900 年代，再继续年视图同步', async () => {
    useYearView()

    expect(onMounted).toHaveBeenCalledTimes(1)
    expect(watch).toHaveBeenCalledTimes(1)

    const syncYearRoute = onMounted.mock.calls[0][0]
    const result = await syncYearRoute()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/year/1901')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.habits.list).not.toHaveBeenCalled()
  })
})
