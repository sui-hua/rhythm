import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { db } from '@/services/database'
import type { Mock } from 'vitest'
import type { DirectionFetchReturn } from '@/views/direction/types'

// 仅 mock onMounted，保留真实的 watch 以测试 watcher 回调行为
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn()
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

let dataStore: ReturnType<typeof useGoalDataStore>
let selectionStore: ReturnType<typeof useGoalSelectionStore>
let batchStore: ReturnType<typeof useGoalBatchStore>
let useDirectionFetch: () => DirectionFetchReturn
let parseDateOnly: (dateStr: string) => Date | null

// 每次测试重置模块以清除模块级 watchersRegistered 守卫
beforeEach(async () => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  setActivePinia(createPinia())
  dataStore = useGoalDataStore()
  selectionStore = useGoalSelectionStore()
  batchStore = useGoalBatchStore()
  dataStore.reset()
  selectionStore.reset()
  batchStore.reset()

  // 重新导入模块，重置模块级变量
  vi.resetModules()
  const mod = await import('@/views/direction/composables/useDirectionFetch')
  useDirectionFetch = mod.useDirectionFetch
  parseDateOnly = mod.parseDateOnly
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * 排空 fetchData 内部的多层 async 链路。
 * fetchData 依次 await db.goal.list → loadGoalMonths → loadGoalDays，
 * 每个 await 产生一个微任务，需要多次 nextTick 才能完全排空。
 */
const drainFetchData = async () => {
  for (let i = 0; i < 10; i++) {
    await nextTick()
  }
}

/**
 * 等待 watcher 异步回调完成。
 * 1. nextTick 让 Vue watcher flush 生效
 * 2. advanceTimersByTimeAsync(0) 处理 watcher 回调中产生的 Promise 链
 */
const flushWatchers = async () => {
  await nextTick()
  await vi.advanceTimersByTimeAsync(0)
}

describe('useDirectionFetch', () => {
  it('parses database date strings as local date-only values', () => {
    const parsed: Date | null = parseDateOnly('2026-04-01')

    expect(parsed).not.toBeNull()
    expect(parsed!.getFullYear()).toBe(2026)
    expect(parsed!.getMonth()).toBe(3)
    expect(parsed!.getDate()).toBe(1)
  })

  it('builds monthly and daily keys from date-only database fields', async () => {
    ;(db.goal.list as Mock).mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    ;(db.goalMonths.list as Mock).mockResolvedValue([
      { id: 'mp1', goal_id: 'p1', month: '2026-04-01' }
    ])
    ;(db.goalDays.list as Mock).mockResolvedValue([
      { id: 'dp1', monthly_goal_id: 'mp1', day: '2026-04-30' }
    ])

    // 不再显式调用 fetchData，composable 内部已自动触发
    useDirectionFetch()
    await drainFetchData()

    expect(batchStore.goalMonthsMap['goal-p1-4']).toEqual({
      id: 'mp1',
      goal_id: 'p1',
      month: '2026-04-01'
    })
    expect(batchStore.dailyTasks['goal-p1-4-30']).toEqual({
      id: 'dp1',
      monthly_goal_id: 'mp1',
      day: '2026-04-30'
    })
  })

  it('loads monthly plans only for the default selected goal during initial fetch', async () => {
    ;(db.goal.list as Mock).mockResolvedValue([
      { id: 'p1', title: '目标 1' },
      { id: 'p2', title: '目标 2' }
    ])
    ;(db.goalMonths.list as Mock).mockResolvedValue([
      { id: 'mp1', goal_id: 'p1', month: '2026-04-01' }
    ])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    useDirectionFetch()
    await drainFetchData()

    expect(db.goalMonths.list).toHaveBeenCalledTimes(1)
    expect(db.goalMonths.list).toHaveBeenCalledWith('p1')
    expect(db.goalMonths.list).not.toHaveBeenCalledWith('p2')
  })

  it('loads daily plans only for the resolved default month during initial fetch', async () => {
    const currentMonth: number = new Date().getMonth() + 1
    const currentMonthDate: string = `2026-${String(currentMonth).padStart(2, '0')}-01`
    const otherMonth: number = currentMonth === 1 ? 2 : 1
    const otherMonthDate: string = `2026-${String(otherMonth).padStart(2, '0')}-01`

    ;(db.goal.list as Mock).mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    ;(db.goalMonths.list as Mock).mockResolvedValue([
      { id: 'mp-other', goal_id: 'p1', month: otherMonthDate },
      { id: 'mp-current', goal_id: 'p1', month: currentMonthDate }
    ])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    useDirectionFetch()
    await drainFetchData()

    expect(db.goalDays.list).toHaveBeenCalledTimes(1)
    expect(db.goalDays.list).toHaveBeenCalledWith('mp-current')
    expect(db.goalDays.list).not.toHaveBeenCalledWith('mp-other')
  })

  it('selects the current month during initial fetch when the current month exists', async () => {
    const currentMonth: number = new Date().getMonth() + 1
    const currentMonthDate: string = `2026-${String(currentMonth).padStart(2, '0')}-01`
    const fallbackMonthDate: string = currentMonth === 1 ? '2026-02-01' : '2026-01-01'

    ;(db.goal.list as Mock).mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    ;(db.goalMonths.list as Mock).mockResolvedValue([
      { id: 'mp-fallback', goal_id: 'p1', month: fallbackMonthDate },
      { id: 'mp-current', goal_id: 'p1', month: currentMonthDate }
    ])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    useDirectionFetch()
    await drainFetchData()

    expect(selectionStore.selectedMonth).toBe(currentMonth)
    expect(db.goalDays.list).toHaveBeenCalledWith('mp-current')
  })

  it('falls back to the first available month during initial fetch when the current month is missing', async () => {
    const currentMonth: number = new Date().getMonth() + 1
    const firstMonth: number = currentMonth === 3 ? 4 : 3
    const laterMonth: number = currentMonth === 7 ? 8 : 7
    const firstMonthDate: string = `2026-${String(firstMonth).padStart(2, '0')}-01`
    const laterMonthDate: string = `2026-${String(laterMonth).padStart(2, '0')}-01`

    ;(db.goal.list as Mock).mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    ;(db.goalMonths.list as Mock).mockResolvedValue([
      { id: 'mp-later', goal_id: 'p1', month: laterMonthDate },
      { id: 'mp-first', goal_id: 'p1', month: firstMonthDate }
    ])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    useDirectionFetch()
    await drainFetchData()

    expect(selectionStore.selectedMonth).toBe(firstMonth)
    expect(db.goalDays.list).toHaveBeenCalledWith('mp-first')
  })
})

describe('watcher registration guard', () => {
  it('registers watchers only once across multiple calls', async () => {
    // 提供两个月度计划，fetchData 会选择当前月或第一个月，
    // 测试中切换到另一个月来验证 watcher 只触发一次
    ;(db.goal.list as Mock).mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    ;(db.goalMonths.list as Mock).mockResolvedValue([
      { id: 'mp1', goal_id: 'p1', month: '2026-04-01' },
      { id: 'mp2', goal_id: 'p1', month: '2026-05-01' }
    ])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    // 第一次调用：注册 watchers + 触发 fetchData
    useDirectionFetch()
    await drainFetchData()

    // 第二次调用：不应注册重复 watchers
    useDirectionFetch()

    // 重置 mock 调用计数，隔离初始加载的影响
    ;(db.goalDays.list as Mock).mockClear()

    // 切换到缓存中已有的另一个月份（与 fetchData 选中的不同）
    // fetchData 会选择当前月或第一个排序月（4月），切换到 5 月触发 watcher
    selectionStore.selectedMonth = 5
    await flushWatchers()

    // loadGoalDays 只应被调用一次（watcher 只注册一次），而非两次
    expect(db.goalDays.list).toHaveBeenCalledTimes(1)
    expect(db.goalDays.list).toHaveBeenCalledWith('mp2')
  })
})

describe('selectedMonth watcher', () => {
  it('reloads daily plans when selectedMonth changes', async () => {
    ;(db.goal.list as Mock).mockResolvedValue([
      { id: 'p1', title: '目标 1' }
    ])
    ;(db.goalMonths.list as Mock).mockResolvedValue([
      { id: 'mp1', goal_id: 'p1', month: '2026-04-01' },
      { id: 'mp2', goal_id: 'p1', month: '2026-05-01' }
    ])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    useDirectionFetch()
    await drainFetchData()

    ;(db.goalDays.list as Mock).mockClear()

    // 模拟用户切换月份（从初始月份切换到 5 月）
    selectionStore.selectedMonth = 5
    await flushWatchers()

    // 应清除旧缓存并加载新月份的日计划
    // 注意：{ force: true } 是 loadGoalDays 的选项，不会透传给 db.goalDays.list
    expect(dataStore.goalDaysCache).not.toHaveProperty('mp1')
    expect(db.goalDays.list).toHaveBeenCalledWith('mp2')
  })
})

describe('selectedGoal watcher', () => {
  it('reloads monthly plans when selectedGoal changes', async () => {
    ;(db.goal.list as Mock).mockResolvedValue([
      { id: 'p1', title: '目标 1' },
      { id: 'p2', title: '目标 2' }
    ])
    ;(db.goalMonths.list as Mock).mockResolvedValue([])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    useDirectionFetch()
    await drainFetchData()

    ;(db.goalMonths.list as Mock).mockClear()
    ;(db.goalDays.list as Mock).mockClear()

    // p2 的月度计划需要独立返回
    ;(db.goalMonths.list as Mock).mockResolvedValue([
      { id: 'mp-p2', goal_id: 'p2', month: '2026-06-01' }
    ])

    // 模拟用户切换目标
    selectionStore.selectedGoal = { id: 'p2', goal_id: 'p2', title: '目标 2', name: '目标 2', category_name: '未分类' }
    await flushWatchers()

    // 应加载新目标的月度计划
    expect(db.goalMonths.list).toHaveBeenCalledWith('p2')
  })
})

describe('showAddModal watcher', () => {
  it('clears editingGoal after modal close delay', async () => {
    ;(db.goal.list as Mock).mockResolvedValue([])
    ;(db.goalMonths.list as Mock).mockResolvedValue([])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    selectionStore.editingGoal = { id: 'g1', goal_id: 'g1', title: '编辑中', name: '编辑中', category_name: '未分类' }

    useDirectionFetch()
    await drainFetchData()

    // 先设为 true，等待 watcher 处理后再设为 false
    // Vue 3 会合并同步更新，必须用 nextTick 分开两次赋值
    dataStore.showAddModal = true
    await nextTick()
    dataStore.showAddModal = false
    await nextTick()

    // 延迟后应清空编辑状态
    await vi.advanceTimersByTimeAsync(300)
    expect(selectionStore.editingGoal).toBeNull()
  })

  it('cancels previous timer when modal toggles false multiple times quickly', async () => {
    ;(db.goal.list as Mock).mockResolvedValue([])
    ;(db.goalMonths.list as Mock).mockResolvedValue([])
    ;(db.goalDays.list as Mock).mockResolvedValue([])

    selectionStore.editingGoal = { id: 'g1', goal_id: 'g1', title: '编辑中', name: '编辑中', category_name: '未分类' }

    useDirectionFetch()
    await drainFetchData()

    // 第一次关闭弹窗
    dataStore.showAddModal = true
    await nextTick()
    dataStore.showAddModal = false
    await nextTick()

    // 100ms 时前一个定时器尚未触发，编辑状态仍保留
    await vi.advanceTimersByTimeAsync(100)
    expect(selectionStore.editingGoal).not.toBeNull()

    // 第二次关闭弹窗（重置定时器）
    dataStore.showAddModal = true
    await nextTick()
    dataStore.showAddModal = false
    await nextTick()

    // 推进 300ms，只有最后一个定时器生效
    await vi.advanceTimersByTimeAsync(300)
    expect(selectionStore.editingGoal).toBeNull()
  })
})
