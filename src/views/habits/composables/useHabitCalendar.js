import { ref, computed, onMounted } from 'vue'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName as formatMonth } from '@/utils/dateFormatter'

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

  const handlePrevMonth = () => {
    if (viewMonth.value === 0) {
      viewMonth.value = 11
      viewYear.value--
    } else {
      viewMonth.value--
    }
    emitMonthChange()
  }

  const handleNextMonth = () => {
    if (viewMonth.value === 11) {
      viewMonth.value = 0
      viewYear.value++
    } else {
      viewMonth.value++
    }
    emitMonthChange()
  }

  const emitMonthChange = () => {
    emit('month-changed', { year: viewYear.value, month: viewMonth.value })
  }

  let isInitialized = false

  onMounted(() => {
    if (!isInitialized) {
      isInitialized = true
      emitMonthChange()
    }
  })

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
