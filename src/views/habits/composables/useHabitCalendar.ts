import { ref, computed, onMounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName as formatMonth } from '@/utils/dateFormatter'

// 日历网格单元：null 表示空位，number 表示日期
export type CalendarCell = number | null

// 月份变更事件的载荷
export interface MonthChangedPayload {
  year: number
  month: number
}

// useHabitCalendar composable 的返回值接口
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
 * 习惯日历逻辑 composable
 *
 * 独立维护日历的年份/月份浏览状态，
 * 计算日历网格数据，处理月份切换与今日判断。
 *
 * @param emit - 父组件的 emit 函数，用于触发 month-changed 事件
 * @returns 日历相关的响应式状态和操作方法
 */
export function useHabitCalendar(emit: (event: 'month-changed', payload: MonthChangedPayload) => void): UseHabitCalendarReturn {
  const dateStore = useDateStore()

  // 独立维护日历中查阅的年份与月份
  const viewYear: Ref<number> = ref(dateStore.currentDate.getFullYear())
  const viewMonth: Ref<number> = ref(dateStore.currentDate.getMonth())

  // 用于展示对应的月份
  const monthName: ComputedRef<string> = computed(() => {
    return formatMonth(viewMonth.value + 1, 'zh')
  })

  // 根据 viewYear 和 viewMonth 动态计算要展示的网格
  const calendarGrid: ComputedRef<CalendarCell[]> = computed(() => {
    const year = viewYear.value
    const month = viewMonth.value
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    // 将周日(0)映射为偏移6，周一(1)映射为偏移0，以此类推
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const grid: CalendarCell[] = []
    for (let i = 0; i < offset; i++) grid.push(null)
    for (let i = 1; i <= daysInMonth; i++) grid.push(i)
    return grid
  })

  const handlePrevMonth = (): void => {
    if (viewMonth.value === 0) {
      viewMonth.value = 11
      viewYear.value--
    } else {
      viewMonth.value--
    }
    emitMonthChange()
  }

  const handleNextMonth = (): void => {
    if (viewMonth.value === 11) {
      viewMonth.value = 0
      viewYear.value++
    } else {
      viewMonth.value++
    }
    emitMonthChange()
  }

  const emitMonthChange = (): void => {
    emit('month-changed', { year: viewYear.value, month: viewMonth.value })
  }

  let isInitialized = false

  onMounted(() => {
    if (!isInitialized) {
      isInitialized = true
      emitMonthChange()
    }
  })

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
