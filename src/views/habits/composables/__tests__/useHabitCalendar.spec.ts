import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock vue 的 onMounted
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn()
  }
})

// mock dateStore
vi.mock('@/stores/dateStore', () => ({
  useDateStore: () => ({
    currentDate: new Date(2026, 5, 5) // 2026年6月5日
  })
}))

// mock dateFormatter
vi.mock('@/utils/dateFormatter', () => ({
  getMonthName: vi.fn((month: number, _locale: string) => {
    const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    return names[month - 1] || ''
  })
}))

import { useHabitCalendar } from '../useHabitCalendar'

describe('useHabitCalendar', () => {
  let mockEmit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockEmit = vi.fn()
    vi.clearAllMocks()
  })

  // 初始化：viewYear 和 viewMonth 来自 dateStore
  it('初始化 viewYear 和 viewMonth 来自 dateStore', () => {
    const { viewYear, viewMonth } = useHabitCalendar(mockEmit)
    expect(viewYear.value).toBe(2026)
    expect(viewMonth.value).toBe(5) // 6月 = month 5 (0-based)
  })

  // calendarGrid：2026年6月的网格计算
  it('calendarGrid 计算 2026年6月 网格（6月1日是周一）', () => {
    const { calendarGrid } = useHabitCalendar(mockEmit)
    // 2026年6月1日是周一，offset=0，无 null 填充
    const grid = calendarGrid.value
    expect(grid).toHaveLength(30) // 6月有30天
    expect(grid[0]).toBe(1)
    expect(grid[29]).toBe(30)
    expect(grid.every((cell: any) => cell !== null)).toBe(true)
  })

  // calendarGrid：月份第一天是周日时有 6 个 null 填充
  it('calendarGrid 周日开头时有 6 个 null 填充', () => {
    const { viewMonth, calendarGrid } = useHabitCalendar(mockEmit)
    // 切换到 2026年2月（2月1日是周日）
    viewMonth.value = 1 // February = 1 (0-based)
    const grid = calendarGrid.value
    const nullCount = grid.filter((c: any) => c === null).length
    expect(nullCount).toBe(6)
    expect(grid[6]).toBe(1)
  })

  // handlePrevMonth：正常月份递减
  it('handlePrevMonth 正常月份递减', () => {
    const { viewMonth, viewYear, handlePrevMonth } = useHabitCalendar(mockEmit)
    viewMonth.value = 5 // June
    handlePrevMonth()
    expect(viewMonth.value).toBe(4) // May
    expect(viewYear.value).toBe(2026)
    expect(mockEmit).toHaveBeenCalledWith('month-changed', { year: 2026, month: 4 })
  })

  // handlePrevMonth：跨年时年份递减
  it('handlePrevMonth 1月跨年时年份递减', () => {
    const { viewMonth, viewYear, handlePrevMonth } = useHabitCalendar(mockEmit)
    viewMonth.value = 0 // January
    viewYear.value = 2026
    handlePrevMonth()
    expect(viewMonth.value).toBe(11) // December
    expect(viewYear.value).toBe(2025)
  })

  // handleNextMonth：正常月份递增
  it('handleNextMonth 正常月份递增', () => {
    const { viewMonth, viewYear, handleNextMonth } = useHabitCalendar(mockEmit)
    viewMonth.value = 5 // June
    handleNextMonth()
    expect(viewMonth.value).toBe(6) // July
    expect(viewYear.value).toBe(2026)
    expect(mockEmit).toHaveBeenCalledWith('month-changed', { year: 2026, month: 6 })
  })

  // handleNextMonth：12月跨年时年份递增
  it('handleNextMonth 12月跨年时年份递增', () => {
    const { viewMonth, viewYear, handleNextMonth } = useHabitCalendar(mockEmit)
    viewMonth.value = 11 // December
    viewYear.value = 2026
    handleNextMonth()
    expect(viewMonth.value).toBe(0) // January
    expect(viewYear.value).toBe(2027)
  })

  // isToday：今天的日期返回 true
  it('isToday 今天的日期返回 true', () => {
    const { viewYear, viewMonth, isToday } = useHabitCalendar(mockEmit)
    const now = new Date()
    // 设置 viewYear/viewMonth 匹配当前真实日期
    viewYear.value = now.getFullYear()
    viewMonth.value = now.getMonth()
    expect(isToday(now.getDate())).toBe(true)
  })

  // isToday：非今天的日期返回 false
  it('isToday 非今天的日期返回 false', () => {
    const { viewYear, viewMonth, isToday } = useHabitCalendar(mockEmit)
    const now = new Date()
    viewYear.value = now.getFullYear()
    viewMonth.value = now.getMonth()
    expect(isToday(now.getDate() === 1 ? 2 : 1)).toBe(false)
  })

  // monthName：返回中文月份名称
  it('monthName 返回中文月份名称', () => {
    const { viewMonth, monthName } = useHabitCalendar(mockEmit)
    viewMonth.value = 5 // June
    expect(monthName.value).toBe('六月')
  })
})
