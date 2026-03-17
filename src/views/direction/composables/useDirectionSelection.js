import { computed } from 'vue'
import {
  selectedGoal,
  selectedMonth,
  selectedDates,
  dailyTasks,
  isSelecting
} from '@/views/direction/composables/useDirectionState'

export function useDirectionSelection() {
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

  const toggleMonth = (m) => {
    selectedMonth.value = selectedMonth.value === m ? null : m
    if (selectedMonth.value && !selectedDates[m]) selectedDates[m] = []
  }

  const datesWithTasks = computed(() => {
    if (!selectedMonth.value) return []
    const days = []
    for (let d = 1; d <= 31; d++) {
      const key = dayTaskKey(d)
      if (dailyTasks[key] && dailyTasks[key].title) {
        days.push(d)
      }
    }
    return days.sort((a, b) => a - b)
  })

  const selectGoal = (g) => {
    selectedGoal.value = g
    selectedMonth.value = null
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
    selectGoal
  }
}
