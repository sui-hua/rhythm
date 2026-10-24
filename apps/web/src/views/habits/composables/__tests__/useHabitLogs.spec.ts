import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import type { AugmentedHabit } from '@/types/models'
import type { ViewContext } from '../useHabitData'
import type { HabitLog as DbHabitLog } from '@/services/db/habit'

// mock db
vi.mock('@/services/database', () => ({
  db: {
    habit: {
      deleteLog: vi.fn(),
      log: vi.fn()
    }
  }
}))

// mock habitStore
const mockPatchHabit = vi.fn()
vi.mock('@/stores/habitStore', () => ({
  useHabitStore: () => ({
    patchHabit: mockPatchHabit
  })
}))

// mock buildPatchedHabit
vi.mock('../useHabitData', () => ({
  buildPatchedHabit: vi.fn((habit: AugmentedHabit, _newLog: DbHabitLog, _ctx: ViewContext) => ({
    ...habit,
    logs: [...(habit.logs || []), { id: 'new-log' }],
    monthlyLogs: [...(habit.monthlyLogs || []), { id: 'new-log' }],
    completedDays: [...(habit.completedDays || []), 15],
    total: (habit.total || 0) + 1
  }))
}))

const mockFeedbackError = vi.fn()
vi.mock('@/composables/useActionFeedback', () => ({
  useActionFeedback: () => ({
    success: vi.fn(),
    error: mockFeedbackError
  })
}))

import { db } from '@/services/database'
import { useHabitLogs, useHabitLogsFormatter } from '../useHabitLogs'

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })

  return { promise, resolve }
}

describe('useHabitLogsFormatter', () => {
  // 格式化日志：正确格式化日期和排序
  it('formattedLogs 按时间倒序排列并格式化日期', () => {
    const logs: DbHabitLog[] = [
      { id: '1', habit_id: 'h1', completed_at: '2026-06-01T10:00:00Z', log: '第一次' },
      { id: '2', habit_id: 'h1', completed_at: '2026-06-15T10:00:00Z', log: '第二次' },
      { id: '3', habit_id: 'h1', completed_at: '2026-06-10T10:00:00Z', log: '' }
    ]
    const { formattedLogs } = useHabitLogsFormatter(logs)
    const result = formattedLogs.value
    expect(result).toHaveLength(3)
    // 最新日期排在最前
    expect(result[0].id).toBe('2')
    expect(result[0].date).toBe('06/15')
    expect(result[0].logText).toBe('第二次')
    expect(result[1].id).toBe('3')
    expect(result[2].id).toBe('1')
  })

  // 空日志返回空数组
  it('formattedLogs 空日志返回空数组', () => {
    const { formattedLogs } = useHabitLogsFormatter([])
    expect(formattedLogs.value).toEqual([])
  })

  // null 输入返回空数组
  it('formattedLogs null 输入返回空数组', () => {
    const { formattedLogs } = useHabitLogsFormatter(null)
    expect(formattedLogs.value).toEqual([])
  })

  // Ref 输入兼容
  it('formattedLogs 支持 Ref 类型输入', () => {
    const logsRef = ref<DbHabitLog[]>([
      { id: '1', habit_id: 'h1', completed_at: '2026-06-01T10:00:00Z', log: 'test' }
    ])
    const { formattedLogs } = useHabitLogsFormatter(logsRef)
    expect(formattedLogs.value).toHaveLength(1)
  })
})

describe('useHabitLogs', () => {
  function createLog(overrides: Partial<DbHabitLog> = {}): DbHabitLog {
    return {
      id: 'log-1',
      habit_id: 'h1',
      completed_at: '2026-06-15T12:00:00Z',
      log: '',
      ...overrides
    }
  }

  function createMockHabit(overrides: Partial<AugmentedHabit> = {}): AugmentedHabit {
    return {
      id: 'h1',
      title: '早起',
      logs: [],
      monthlyLogs: [],
      completedDays: [],
      total: 0,
      completionRate: 0,
      streak: 0,
      ...overrides
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // toggleComplete：无选中习惯时早返回
  it('toggleComplete 无选中习惯时直接返回', async () => {
    const selectedHabit = computed(() => null)
    const fetchHabits = vi.fn()
    const { toggleComplete } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    await toggleComplete(15)
    expect(db.habit.deleteLog).not.toHaveBeenCalled()
    expect(db.habit.log).not.toHaveBeenCalled()
  })

  // toggleComplete：已有打卡时删除（取消打卡）
  it('toggleComplete 已有打卡时删除记录', async () => {
    const existingLog = createLog()
    const habit = createMockHabit({
      logs: [existingLog],
      monthlyLogs: [existingLog],
      completedDays: [15],
      total: 1
    })
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.deleteLog).mockResolvedValue(undefined)

    const { toggleComplete } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    await toggleComplete(15)

    expect(db.habit.deleteLog).toHaveBeenCalledWith('log-1')
    expect(mockPatchHabit).toHaveBeenCalled()
  })

  // toggleComplete：删除失败时回滚（调用 fetchHabits）
  it('toggleComplete 删除失败时调用 fetchHabits 回滚', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const existingLog = createLog()
    const habit = createMockHabit({
      logs: [existingLog],
      monthlyLogs: [existingLog],
      completedDays: [15],
      total: 1
    })
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.deleteLog).mockRejectedValue(new Error('delete failed'))

    const { toggleComplete } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    await toggleComplete(15)

    expect(fetchHabits).toHaveBeenCalled()
    expect(mockFeedbackError).toHaveBeenCalledWith('取消打卡失败，已恢复数据', expect.any(Error))
    consoleSpy.mockRestore()
  })

  // toggleComplete：无打卡时新增（乐观更新 + 写入数据库）
  it('toggleComplete 无打卡时新增记录并写入数据库', async () => {
    const habit = createMockHabit()
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.log).mockResolvedValue(undefined)

    const { toggleComplete, isSubmitting } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    await toggleComplete(15)

    expect(mockPatchHabit).toHaveBeenCalled()
    expect(db.habit.log).toHaveBeenCalledWith('h1', '', expect.any(Date))
    expect(fetchHabits).toHaveBeenCalled()
    expect(isSubmitting.value).toBe(false)
  })

  // toggleComplete：新增 pending 时重复触发只写入一次
  it('toggleComplete 新增 pending 时重复触发只调用一次打卡服务', async () => {
    const gate = deferred<DbHabitLog>()
    const habit = createMockHabit()
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.log).mockReturnValue(gate.promise)

    const { toggleComplete, isSubmitting } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    const first = toggleComplete(15)
    const second = toggleComplete(15)

    expect(isSubmitting.value).toBe(true)
    expect(db.habit.log).toHaveBeenCalledTimes(1)

    gate.resolve(createLog({ id: 'new-log' }))
    await first
    await second

    expect(db.habit.log).toHaveBeenCalledTimes(1)
  })

  // toggleComplete：删除 pending 时重复触发只删除一次
  it('toggleComplete 删除 pending 时重复触发只调用一次删除服务', async () => {
    const gate = deferred()
    const existingLog = createLog()
    const habit = createMockHabit({
      logs: [existingLog],
      monthlyLogs: [existingLog],
      completedDays: [15],
      total: 1
    })
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.deleteLog).mockReturnValue(gate.promise)

    const { toggleComplete, isSubmitting } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    const first = toggleComplete(15)
    const second = toggleComplete(15)

    expect(isSubmitting.value).toBe(true)
    expect(db.habit.deleteLog).toHaveBeenCalledTimes(1)

    gate.resolve()
    await first
    await second

    expect(db.habit.deleteLog).toHaveBeenCalledTimes(1)
  })

  // toggleComplete：新增失败时回滚并提示用户
  it('toggleComplete 新增失败时调用 fetchHabits 回滚并提示用户', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const habit = createMockHabit()
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.log).mockRejectedValue(new Error('write failed'))

    const { toggleComplete } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    await toggleComplete(15)

    expect(fetchHabits).toHaveBeenCalled()
    expect(mockFeedbackError).toHaveBeenCalledWith('打卡失败，已恢复数据', expect.any(Error))
    consoleSpy.mockRestore()
  })

  // handleQuickLog：空备注返回 false
  it('handleQuickLog 空备注返回 false', async () => {
    const habit = createMockHabit()
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn()
    const { handleQuickLog } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    const result = await handleQuickLog('')
    expect(result).toBe(false)
    expect(db.habit.log).not.toHaveBeenCalled()
  })

  // handleQuickLog：今日已有打卡返回 false
  it('handleQuickLog 今日已有打卡返回 false', async () => {
    const now = new Date()
    const todayLog = {
      id: 'log-today',
      habit_id: 'h1',
      completed_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString(),
      log: ''
    }
    const habit = createMockHabit({
      monthlyLogs: [todayLog]
    })
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn()
    const { handleQuickLog } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    const result = await handleQuickLog('备注内容')
    expect(result).toBe(false)
  })

  // handleQuickLog：正常快速打卡
  it('handleQuickLog 正常打卡返回 true', async () => {
    const habit = createMockHabit({ monthlyLogs: [] })
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.log).mockResolvedValue(undefined)

    const { handleQuickLog } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    const result = await handleQuickLog('今天状态不错')
    expect(result).toBe(true)
    expect(db.habit.log).toHaveBeenCalledWith('h1', '今天状态不错', expect.any(Date))
  })

  // handleQuickLog：本地日志过期时由服务层兜底幂等，组件侧仍只发起一次写请求
  it('handleQuickLog 本地无今日记录时只调用一次打卡服务', async () => {
    const habit = createMockHabit({ monthlyLogs: [] })
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn()
    vi.mocked(db.habit.log).mockResolvedValue({
      id: 'existing-log',
      habit_id: 'h1',
      completed_at: new Date().toISOString(),
      log: '旧备注'
    })

    const { handleQuickLog } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    const result = await handleQuickLog('今天状态不错')

    expect(result).toBe(true)
    expect(db.habit.log).toHaveBeenCalledTimes(1)
    expect(fetchHabits).toHaveBeenCalledTimes(1)
  })

  // handleQuickLog：pending 时重复触发只写入一次
  it('handleQuickLog pending 时重复触发只调用一次打卡服务', async () => {
    const gate = deferred<DbHabitLog>()
    const habit = createMockHabit({ monthlyLogs: [] })
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.log).mockReturnValue(gate.promise)

    const { handleQuickLog, isSubmitting } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    const first = handleQuickLog('今天状态不错')
    const second = handleQuickLog('今天状态不错')

    expect(isSubmitting.value).toBe(true)
    expect(db.habit.log).toHaveBeenCalledTimes(1)

    gate.resolve(createLog({ id: 'new-log' }))
    await expect(first).resolves.toBe(true)
    await expect(second).resolves.toBe(false)
    expect(db.habit.log).toHaveBeenCalledTimes(1)
  })

  // handleQuickLog：写入失败时回滚并返回 false
  it('handleQuickLog 写入失败时回滚并返回 false', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const habit = createMockHabit({ monthlyLogs: [] })
    const selectedHabit = computed(() => habit)
    const fetchHabits = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.habit.log).mockRejectedValue(new Error('write failed'))

    const { handleQuickLog } = useHabitLogs(selectedHabit, ref(2026), ref(5), fetchHabits)
    const result = await handleQuickLog('备注')
    expect(result).toBe(false)
    expect(fetchHabits).toHaveBeenCalled()
    expect(mockFeedbackError).toHaveBeenCalledWith('快速打卡失败，已恢复数据', expect.any(Error))
    consoleSpy.mockRestore()
  })
})
