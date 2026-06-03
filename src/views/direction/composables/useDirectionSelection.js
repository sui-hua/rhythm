import { computed } from 'vue'
import { getDateOnlyDay, getDateOnlyMonth, getDateOnlyYear } from '@/views/direction/utils/dateOnly'
import { useDirectionStore } from '@/stores/directionStore'
import { storeToRefs } from 'pinia'

export function useDirectionSelection() {
  const store = useDirectionStore()
  const { selectedGoal, selectedMonth, isSelecting, activePicker, archiveVersion } = storeToRefs(store)

  const goalKey = (m) => {
    if (!selectedGoal.value) return `undefined-${m}`
    return `goal-${selectedGoal.value.goal_id}-${m}`
  }

  const dayTaskKey = (day) => `${goalKey(selectedMonth.value)}-${day}`

  const isSelected = (m, day) => store.selectedDates[m]?.includes(day)
  const hasTask = (m, day) => !!(store.dailyTasks[`${goalKey(m)}-${day}`]?.title)

  const canSelect = (m, day) => {
    const current = store.selectedDates[m]
    if (!current || current.length === 0) return true

    const firstDay = current[0]
    const targetType = hasTask(m, firstDay)
    const currentType = hasTask(m, day)

    return targetType === currentType
  }

  const startSelection = (day) => {
    const m = selectedMonth.value

    const isCurrentlySelected = store.selectedDates[m]?.includes(day)
    if (!isCurrentlySelected && !canSelect(m, day)) return

    isSelecting.value = true
    if (!store.selectedDates[m]) store.selectedDates[m] = []

    const idx = store.selectedDates[m].indexOf(day)
    idx > -1 ? store.selectedDates[m].splice(idx, 1) : store.selectedDates[m].push(day)
  }

  const handleMouseEnter = (day) => {
    if (isSelecting.value) {
      const m = selectedMonth.value
      if (!canSelect(m, day)) return

      if (!store.selectedDates[m].includes(day)) store.selectedDates[m].push(day)
    }
  }

  const endSelection = () => { isSelecting.value = false }

  const deselectAllInMonth = () => { store.selectedDates[selectedMonth.value] = [] }

const getMonthOffset = (month) => {
  if (!selectedGoal.value) {
    return new Date(new Date().getFullYear(), month - 1, 1).getDay()
  }

  const cached = store.goalMonthsCache[selectedGoal.value.goal_id] || []
  const mp = cached.find(item => getDateOnlyMonth(item.month) === month)
  if (!mp) {
    return new Date(new Date().getFullYear(), month - 1, 1).getDay()
  }

  const year = getDateOnlyYear(mp.month) || new Date().getFullYear()
  return new Date(year, month - 1, 1).getDay()
}

const selectWeekDay = (month, weekIndex) => {
  const year = new Date().getFullYear()
  const daysInMonth = new Date(year, month, 0).getDate()

  const targetDays = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay()
    if (dayOfWeek === weekIndex) {
      targetDays.push(d)
    }
  }

  const currentSelection = store.selectedDates[month] || []
  const isAllSelected = targetDays.every(d => currentSelection.includes(d))

  let newSelection
  if (isAllSelected) {
    newSelection = currentSelection.filter(d => !targetDays.includes(d))
  } else {
    newSelection = [...new Set([...currentSelection, ...targetDays])]
  }

  store.selectedDates[month] = newSelection.sort((a, b) => a - b)
}

const isAllSelectedDatesHaveTask = (month) => {
  const dates = store.selectedDates[month] || []
  if (dates.length === 0) return false
  return dates.every(day => hasTask(month, day))
}

  const toggleMonth = (m) => {
    selectedMonth.value = selectedMonth.value === m ? null : m
    if (selectedMonth.value && !store.selectedDates[m]) store.selectedDates[m] = []
  }

  const datesWithTasks = computed(() => {
  archiveVersion.value
  const goalId = selectedGoal.value?.goal_id
  if (!goalId || selectedMonth.value == null) return []

  const goalMonthsOfGoal = store.goalMonthsCache[goalId] || []
  const mp = goalMonthsOfGoal.find(
    item => getDateOnlyMonth(item.month) === selectedMonth.value
  )
  if (!mp) return []

  return (store.goalDaysCache[mp.id] || [])
    .filter(dp => dp.title)
    .map(dp => getDateOnlyDay(dp.day))
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
    selectedDates: store.selectedDates,
    dailyTasks: store.dailyTasks,
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
    selectWeekDay,
    isAllSelectedDatesHaveTask
  }
}
