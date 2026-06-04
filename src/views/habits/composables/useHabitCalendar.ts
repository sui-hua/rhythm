// useHabitCalendar.ts
// 习惯模块的日历视图逻辑，独立维护浏览月份和网格计算

import { ref, computed, onMounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName as formatMonth } from '@/utils/dateFormatter'

// 日历网格单元：null 表示空位（上月末/下月初），number 表示当月日期
export type CalendarCell = number | null

// 月份变更事件的载荷，传递给父组件用于数据联动
export interface MonthChangedPayload {
  year: number
  month: number
}

// useHabitCalendar composable 的返回值类型
export interface UseHabitCalendarReturn {
  viewYear: Ref<number>
  viewMonth: Ref<number>
  calendarGrid: ComputedRef<CalendarCell[]>
  monthName: ComputedRef<string>
  handlePrevMonth: () => void
  handleNextMonth: () => void
  isToday: (day: number) => boolean
  emitMonthChange: () => void
}

/**
 * 习惯日历视图逻辑
 *
 * 使用场景：Habits 模块的日历组件，独立于全局日期状态维护浏览月份
 * 数据流：viewYear/viewMonth → calendarGrid 计算 → 组件渲染
 *
 * @param emit - 父组件的 emit 函数，用于触发 month-changed 事件通知数据层
 * @returns 日历相关的响应式状态和操作方法
 */
export function useHabitCalendar(emit: (event: 'month-changed', payload: MonthChangedPayload) => void): UseHabitCalendarReturn {
  const dateStore = useDateStore()

  // 独立维护日历中查阅的年份与月份，不受全局 dateStore 影响
  const viewYear: Ref<number> = ref(dateStore.currentDate.getFullYear())
  const viewMonth: Ref<number> = ref(dateStore.currentDate.getMonth())

  // 中文月份名称，用于日历头部展示
  const monthName: ComputedRef<string> = computed(() => {
    return formatMonth(viewMonth.value + 1, 'zh')
  })

  // 根据 viewYear 和 viewMonth 动态计算日历网格，含上月末/下月初的填充
  const calendarGrid: ComputedRef<CalendarCell[]> = computed(() => {
    const year = viewYear.value
    const month = viewMonth.value
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    // 将周日(0)映射为偏移6，周一(1)映射为偏移0，符合 ISO 8601 周起始日
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const grid: CalendarCell[] = []
    // null 填充上月末尾的空位，保持日期格子对齐
    for (let i = 0; i < offset; i++) grid.push(null)
    for (let i = 1; i <= daysInMonth; i++) grid.push(i)
    return grid
  })

  // 切换到上一个月，跨年时自动递减年份
  const handlePrevMonth = (): void => {
    if (viewMonth.value === 0) {
      viewMonth.value = 11
      viewYear.value--
    } else {
      viewMonth.value--
    }
    emitMonthChange()
  }

  // 切换到下一个月，跨年时自动递增年份
  const handleNextMonth = (): void => {
    if (viewMonth.value === 11) {
      viewMonth.value = 0
      viewYear.value++
    } else {
      viewMonth.value++
    }
    emitMonthChange()
  }

  // 通知父组件月份已变更，触发数据层重新拉取日志
  const emitMonthChange = (): void => {
    emit('month-changed', { year: viewYear.value, month: viewMonth.value })
  }

  // 初始化守卫：防止 onMounted 在 SSR 或多次挂载时重复触发
  let isInitialized = false

  onMounted(() => {
    if (!isInitialized) {
      isInitialized = true
      emitMonthChange()
    }
  })

  // 判断指定日期是否为系统真实今天，用于高亮当日格子
  const isToday = (day: number): boolean => {
    const now = new Date()
    return (
      now.getFullYear() === viewYear.value &&
      now.getMonth() === viewMonth.value &&
      now.getDate() === day
    )
  }

  return {
    viewYear,
    viewMonth,
    calendarGrid,
    monthName,
    handlePrevMonth,
    handleNextMonth,
    isToday,
    emitMonthChange
  }
}
