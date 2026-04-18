/**
 * ============================================
 * 习惯日历视图 (views/habits/composables/useHabitCalendar.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理习惯日历视图的状态
 * - 计算日历网格（42 格，6 行）
 * - 处理月份切换逻辑
 * - 判断"今天"高亮
 *
 * 【日历网格计算】
 * - offset = (周一到当月第一天的天数) - 1
 * - 前半部分填充 null（上月的日子）
 * - 后半部分填充当月日期
 * - 总共 42 格（6 周 × 7 天）
 *
 * 【月份导航】
 * - handlePrevMonth() → 上一个月（跨年处理）
 * - handleNextMonth() → 下一个月（跨年处理）
 */
import { ref, computed } from 'vue'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName as formatMonth } from '@/utils/dateFormatter'

/**
 * 习惯日历核心逻辑 (Composable)
 * 封装日历视图的状态计算、月份导航和日期判断逻辑。
 * @param {Function} emit - 组件的 emit 方法，用于抛出事件
 */
export function useHabitCalendar(emit) {
  const dateStore = useDateStore()

  // 独立维护日历中查阅的年份与月份
  const viewYear = ref(dateStore.currentDate.getFullYear())
  const viewMonth = ref(dateStore.currentDate.getMonth())

  // 用于展示对应的月份
  const monthName = computed(() => {
    return formatMonth(viewMonth.value + 1, 'zh')
  })

  // 根据 viewYear 和 viewMonth 动态计算要展示的网格
  const calendarGrid = computed(() => {
    const year = viewYear.value
    const month = viewMonth.value
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const grid = []
    for (let i = 0; i < offset; i++) grid.push(null)
    for (let i = 1; i <= daysInMonth; i++) grid.push(i)
    return grid
  })

  /**
   * 点击上一月按钮的翻页处理逻辑
   * 处理跨年减岁边界情况并调用对外发出事件。
   */
  const handlePrevMonth = () => {
    if (viewMonth.value === 0) {
      viewMonth.value = 11
      viewYear.value--
    } else {
      viewMonth.value--
    }
    emitMonthChange()
  }

  /**
   * 点击下一月按钮的翻页处理逻辑
   * 处理跨年增岁边界情况并调用对外发出事件。
   */
  const handleNextMonth = () => {
    if (viewMonth.value === 11) {
      viewMonth.value = 0
      viewYear.value++
    } else {
      viewMonth.value++
    }
    emitMonthChange()
  }

  /** 包装好的抛出含带最新年月状态的通用事件方法 */
  const emitMonthChange = () => {
    emit('month-changed', { year: viewYear.value, month: viewMonth.value })
  }

  /**
   * 判断日历格子中遍历的日是否等同于真实的"今天"，提供高亮光圈样式
   */
  const isToday = (day) => {
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
