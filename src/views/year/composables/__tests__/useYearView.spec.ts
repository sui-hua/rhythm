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

vi.mock('@/services/database', () => ({
  db: {
    habit: {
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
  // 使用 let 使 route 对象可在测试中重新赋值
  let route: { params: { year: string } } = {
    params: {
      year: '1'
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
    vi.mocked(db.habit.list).mockResolvedValue([] as any)
    vi.mocked(db.habit.listLogsByYear).mockResolvedValue([] as any)
  })

  it('0-99 的 year 路由会先规范化到 1900 年代，再继续年视图同步', async () => {
    useYearView()

    expect(onMounted).toHaveBeenCalledTimes(1)
    expect(watch).toHaveBeenCalledTimes(1)

    // onMounted 的回调函数是 syncYearRoute
    const syncYearRoute = (onMounted as Mock).mock.calls[0][0] as () => Promise<boolean>
    const result = await syncYearRoute()

    expect(result).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/year/1901')
    expect(dateStore.setYearMonthDay).not.toHaveBeenCalled()
    expect(db.habit.list).not.toHaveBeenCalled()
  })
})
