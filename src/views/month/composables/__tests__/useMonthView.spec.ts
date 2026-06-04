import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

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

// 数据库 mock，使用 db.task（非 db.tasks）匹配实际 database.ts 导出结构
vi.mock('@/services/database', () => ({
  db: {
    task: {
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
  // 使用 let 使 route 对象可在测试中重新赋值
  let route: { params: { year: string; month: string } } = {
    params: {
      year: '02026',
      month: '04'
    }
  }

  // mock 路由对象，包含 push 和 replace 方法
  const router = {
    push: vi.fn(),
    replace: vi.fn()
  }

  // mock 日期 store，包含 currentDate 和 setYearMonthDay 方法
  const dateStore = {
    currentDate: new Date(2025, 0, 1),
    setYearMonthDay: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // 通过 vi.mocked 获取类型安全的 mock 引用
    vi.mocked(useRoute).mockReturnValue(route as any)
    vi.mocked(useRouter).mockReturnValue(router as any)
    vi.mocked(useDateStore).mockReturnValue(dateStore as any)
    vi.mocked(db.task.list).mockResolvedValue([] as any)
  })

  it('会先把非 canonical month 路由重定向到 canonical URL，再避免同步和取数', async () => {
    useMonthView()

    expect(onMounted).toHaveBeenCalledTimes(1)
    expect(watch).toHaveBeenCalledTimes(1)

    // onMounted 的回调函数是 handleRouteSync
    const handleRouteSync = (onMounted as Mock).mock.calls[0][0] as () => Promise<boolean>
    const result = await handleRouteSync()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/month/2026/4')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.task.list).not.toHaveBeenCalled()
  })

  it('year 非法但 month 有效时，会保留 month 并回到 canonical month 路由', async () => {
    route = {
      params: {
        year: 'abc',
        month: '4'
      }
    }
    vi.mocked(useRoute).mockReturnValue(route as any)

    useMonthView()

    const handleRouteSync = (onMounted as Mock).mock.calls[0][0] as () => Promise<boolean>
    const result = await handleRouteSync()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/month/2025/4')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.task.list).not.toHaveBeenCalled()
  })

  it('会把超出范围的 month 路由回退到 year 路由，而不是继续取数', async () => {
    route = {
      params: {
        year: '02026',
        month: '13'
      }
    }
    vi.mocked(useRoute).mockReturnValue(route as any)

    useMonthView()

    const handleRouteSync = (onMounted as Mock).mock.calls[0][0] as () => Promise<boolean>
    const result = await handleRouteSync()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/year/2026')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.task.list).not.toHaveBeenCalled()
  })

  it('0-99 的 year 路由会先规范化到 1900 年代，再继续月视图同步', async () => {
    route = {
      params: {
        year: '1',
        month: '4'
      }
    }
    vi.mocked(useRoute).mockReturnValue(route as any)

    useMonthView()

    const handleRouteSync = (onMounted as Mock).mock.calls[0][0] as () => Promise<boolean>
    const result = await handleRouteSync()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/month/1901/4')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.task.list).not.toHaveBeenCalled()
  })
})
