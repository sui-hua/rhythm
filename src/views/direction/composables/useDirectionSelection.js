/**
 * 方向模块选择逻辑 (useDirectionSelection.js)
 * 处理目标选择、月份展开、日期范围选择（框选/星期选）以及星期快捷选择。
 */
import { computed } from 'vue'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { getIsoDay, getIsoMonth, getIsoYear } from '@/utils/dateParts'
import {
  selectedGoal,
  selectedMonth,
  selectedDates,
  dailyTasks,
  isSelecting,
  activePicker,
  monthlyPlansCache,
  dailyPlansCache,
  archiveVersion
} from '@/views/direction/composables/useDirectionState'

export function useDirectionSelection() {
  const { loadDailyPlans } = useDirectionFetch()

  const getMonthDateContext = (month) => {
    if (!selectedGoal.value) {
      return {
        year: new Date().getFullYear(),
        month
      }
    }

    const cached = monthlyPlansCache[selectedGoal.value.plan_id] || []
    const mp = cached.find(item => getIsoMonth(item.month) === month)
    if (!mp) {
      return {
        year: new Date().getFullYear(),
        month
      }
    }

    return {
      year: getIsoYear(mp.month) || new Date().getFullYear(),
      month
    }
  }

  const getDaysInMonth = (month) => {
    const { year } = getMonthDateContext(month)
    return new Date(year, month, 0).getDate()
  }

  const goalKey = (m) => {
    if (!selectedGoal.value) return `undefined-${m}`
    return `plan-${selectedGoal.value.plan_id}-${m}`
  }

  const dayTaskKey = (day) => `${goalKey(selectedMonth.value)}-${day}`

  const isSelected = (m, day) => selectedDates[m]?.includes(day)
  const hasTask = (m, day) => !!(dailyTasks[`${goalKey(m)}-${day}`]?.title)

  const canSelect = (m, day) => {
    const current = selectedDates[m]
    if (!current || current.length === 0) return true

    const firstDay = current[0]
    const targetType = hasTask(m, firstDay)
    const currentType = hasTask(m, day)

    return targetType === currentType
  }

  const startSelection = (day) => {
    const m = selectedMonth.value

    const isCurrentlySelected = selectedDates[m]?.includes(day)
    if (!isCurrentlySelected && !canSelect(m, day)) return

    isSelecting.value = true
    if (!selectedDates[m]) selectedDates[m] = []

    const idx = selectedDates[m].indexOf(day)
    idx > -1 ? selectedDates[m].splice(idx, 1) : selectedDates[m].push(day)
  }

  const handleMouseEnter = (day) => {
    if (isSelecting.value) {
      const m = selectedMonth.value
      if (!canSelect(m, day)) return

      if (!selectedDates[m].includes(day)) selectedDates[m].push(day)
    }
  }

  const endSelection = () => { isSelecting.value = false }

  const deselectAllInMonth = () => { selectedDates[selectedMonth.value] = [] }

/**
 * 获取指定月份的偏移量（该月第一天是星期几）
 * @param {number} month - 月份（1-12）
 */
const getMonthOffset = (month) => {
  const { year } = getMonthDateContext(month)
  return new Date(year, month - 1, 1).getDay()
}

/**
 * 按星期索引选择该月所有对应的日期
 * @param {number} month - 月份（1-12）
 * @param {number} weekIndex - 星期索引（0=周日, 1=周一, ..., 6=周六）
 */
const selectWeekDay = (month, weekIndex) => {
  const { year } = getMonthDateContext(month)
  const daysInMonth = getDaysInMonth(month)

  const targetDays = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay()
    if (dayOfWeek === weekIndex) {
      targetDays.push(d)
    }
  }

  const currentSelection = selectedDates[month] || []
  const isAllSelected = targetDays.every(d => currentSelection.includes(d))

  let newSelection
  if (isAllSelected) {
    newSelection = currentSelection.filter(d => !targetDays.includes(d))
  } else {
    newSelection = [...new Set([...currentSelection, ...targetDays])]
  }

  selectedDates[month] = newSelection.sort((a, b) => a - b)
}

/**
 * 判断指定月份的所有选中日期是否都有任务
 * @param {number} month - 月份（1-12）
 */
const isAllSelectedDatesHaveTask = (month) => {
  const dates = selectedDates[month] || []
  if (dates.length === 0) return false
  return dates.every(day => hasTask(month, day))
}

  const toggleMonth = async (m) => {
    selectedMonth.value = selectedMonth.value === m ? null : m
    if (!selectedMonth.value) return

    if (!selectedDates[m]) selectedDates[m] = []

    const planId = selectedGoal.value?.plan_id
    if (!planId) return

    const monthlyPlansOfGoal = monthlyPlansCache[planId] || []
    const mp = monthlyPlansOfGoal.find(
      item => getIsoMonth(item.month) === m
    )

    if (mp) {
      await loadDailyPlans(mp.id)
    }
  }

  const datesWithTasks = computed(() => {
  archiveVersion.value
  const planId = selectedGoal.value?.plan_id
  if (!planId || selectedMonth.value == null) return []

  const monthlyPlansOfGoal = monthlyPlansCache[planId] || []
  const mp = monthlyPlansOfGoal.find(
    item => getIsoMonth(item.month) === selectedMonth.value
  )
  if (!mp) return []

  return (dailyPlansCache[mp.id] || [])
    .filter(dp => dp.title)
    .map(dp => getIsoDay(dp.day))
    .filter(day => day !== null)
    .sort((a, b) => a - b)
})

  const selectGoal = (g) => {
  selectedGoal.value = g
  selectedMonth.value = null
  activePicker.value = 'start'
}

  return {
    selectedGoal,
    selectedMonth,
    selectedDates,
    dailyTasks,
    datesWithTasks,
    goalKey,
    dayTaskKey,
    isSelected,
    hasTask,
    canSelect,
    startSelection,
    handleMouseEnter,
    endSelection,
    deselectAllInMonth,
    toggleMonth,
    selectGoal,
    getMonthOffset,
    getDaysInMonth,
    selectWeekDay,
    isAllSelectedDatesHaveTask
  }
}
