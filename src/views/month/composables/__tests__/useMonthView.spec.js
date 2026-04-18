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
    tasks: {
      list: vi.fn()
    }
  }
}))

import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDateStore } from '@/stores/dateStore'
import { db } from '@/services/database'
import { useMonthView } from '@/views/month/composables/useMonthView'

describe('useMonthView', () => {
  const route = {
    params: {
      year: '02026',
      month: '04'
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
    db.tasks.list.mockResolvedValue([])
  })

  it('会先把非 canonical month 路由重定向到 canonical URL，再避免同步和取数', async () => {
    useMonthView()

    expect(onMounted).toHaveBeenCalledTimes(1)
    expect(watch).toHaveBeenCalledTimes(1)

    const handleRouteSync = onMounted.mock.calls[0][0]
    const result = await handleRouteSync()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/month/2026/4')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.tasks.list).not.toHaveBeenCalled()
  })

  it('year 非法但 month 有效时，会保留 month 并回到 canonical month 路由', async () => {
    route.params = {
      year: 'abc',
      month: '4'
    }

    useMonthView()

    const handleRouteSync = onMounted.mock.calls[0][0]
    const result = await handleRouteSync()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/month/2025/4')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.tasks.list).not.toHaveBeenCalled()
  })

  it('会把超出范围的 month 路由回退到 year 路由，而不是继续取数', async () => {
    route.params = {
      year: '02026',
      month: '13'
    }

    useMonthView()

    const handleRouteSync = onMounted.mock.calls[0][0]
    const result = await handleRouteSync()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/year/2026')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.tasks.list).not.toHaveBeenCalled()
  })

  it('0-99 的 year 路由会先规范化到 1900 年代，再继续月视图同步', async () => {
    route.params = {
      year: '1',
      month: '4'
    }

    useMonthView()

    const handleRouteSync = onMounted.mock.calls[0][0]
    const result = await handleRouteSync()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/month/1901/4')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.tasks.list).not.toHaveBeenCalled()
  })
})
