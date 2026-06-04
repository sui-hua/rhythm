/**
 * Direction 日期选择 composable。
 * 管理目标选择、月份切换、日期范围拖选等交互逻辑。
 */

import { computed } from 'vue'
import { getDateOnlyDay, getDateOnlyMonth, getDateOnlyYear } from '@/views/direction/utils/dateOnly'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { storeToRefs } from 'pinia'
import type { GoalDay, GoalMonth, GoalWithMeta, DirectionSelectionReturn } from '@/views/direction/types'

export function useDirectionSelection(): DirectionSelectionReturn {
  const dataStore = useGoalDataStore()
  const selectionStore = useGoalSelectionStore()
  const batchStore = useGoalBatchStore()
  const { selectedGoal, selectedMonth, isSelecting, activePicker } = storeToRefs(selectionStore)
  const { archiveVersion } = storeToRefs(dataStore)

  // 将 store 的 reactive 属性断言为具体类型
  const selectedDates = batchStore.selectedDates as unknown as Record<number, number[]>
  const dailyTasks = batchStore.dailyTasks as unknown as Record<string, GoalDay>
  const goalMonthsCache = dataStore.goalMonthsCache as unknown as Record<string, GoalMonth[]>
  const goalDaysCache = dataStore.goalDaysCache as unknown as Record<string, GoalDay[]>

  /** 生成 goal-month 复合 key，用于匹配缓存中的条目 */
  const goalKey = (m: number): string => {
    const goal = selectedGoal.value as unknown as GoalWithMeta | null
    if (!goal) return `undefined-${m}`
    return `goal-${goal.goal_id}-${m}`
  }

  /** 生成 goal-month-day 复合 key，用于匹配 dailyTasks 中的条目 */
  const dayTaskKey = (day: number): string => `${goalKey(selectedMonth.value!)}-${day}`

  /** 判断指定月份的指定日期是否在选中列表中 */
  const isSelected = (m: number, day: number): boolean => {
    return selectedDates[m]?.includes(day) ?? false
  }

  /** 判断指定月份的指定日期是否有任务标题 */
  const hasTask = (m: number, day: number): boolean => {
    return !!(dailyTasks[`${goalKey(m)}-${day}`]?.title)
  }

  /** 判断指定日期是否可以被选中（同一批次只能选同类日期） */
  const canSelect = (m: number, day: number): boolean => {
    const current = selectedDates[m]
    if (!current || current.length === 0) return true

    const firstDay = current[0]!
    const targetType = hasTask(m, firstDay)
    const currentType = hasTask(m, day)

    return targetType === currentType
  }

  /** 开始拖选：切换选中状态或开始范围选择 */
  const startSelection = (day: number): void => {
    const m = selectedMonth.value!

    const isCurrentlySelected = selectedDates[m]?.includes(day)
    if (!isCurrentlySelected && !canSelect(m, day)) return

    isSelecting.value = true
    if (!selectedDates[m]) selectedDates[m] = []

    const idx = selectedDates[m].indexOf(day)
    idx > -1 ? selectedDates[m].splice(idx, 1) : selectedDates[m].push(day)
  }

  /** 拖选过程中鼠标移入：扩展选中范围 */
  const handleMouseEnter = (day: number): void => {
    if (isSelecting.value) {
      const m = selectedMonth.value
      if (m == null) return
      if (!canSelect(m, day)) return

      if (!selectedDates[m]?.includes(day)) selectedDates[m]?.push(day)
    }
  }

  /** 结束拖选 */
  const endSelection = (): void => { isSelecting.value = false }

  /** 取消当前月份的所有日期选中 */
  const deselectAllInMonth = (): void => {
    selectedDates[selectedMonth.value!] = []
  }

  /** 计算指定月份第一天是星期几（考虑目标的实际年份） */
  const getMonthOffset = (month: number): number => {
    const goal = selectedGoal.value as unknown as GoalWithMeta | null
    if (!goal) {
      return new Date(new Date().getFullYear(), month - 1, 1).getDay()
    }

    const cached = goalMonthsCache[String(goal.goal_id)] || []
    const mp = cached.find(item => getDateOnlyMonth(item.month) === month)
    if (!mp) {
      return new Date(new Date().getFullYear(), month - 1, 1).getDay()
    }

    const year = getDateOnlyYear(mp.month) || new Date().getFullYear()
    return new Date(year, month - 1, 1).getDay()
  }

  /** 选中/取消指定星期几的所有日期 */
  const selectWeekDay = (month: number, weekIndex: number): void => {
    const year = new Date().getFullYear()
    const daysInMonth = new Date(year, month, 0).getDate()

    const targetDays: number[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay()
      if (dayOfWeek === weekIndex) {
        targetDays.push(d)
      }
    }

    const currentSelection = selectedDates[month] || []
    const isAllSelected = targetDays.every(d => currentSelection.includes(d))

    let newSelection: number[]
    if (isAllSelected) {
      newSelection = currentSelection.filter(d => !targetDays.includes(d))
    } else {
      newSelection = [...new Set([...currentSelection, ...targetDays])]
    }

    selectedDates[month] = newSelection.sort((a, b) => a - b)
  }

  /** 判断当前月份所有选中日期是否都有任务 */
  const isAllSelectedDatesHaveTask = (month: number): boolean => {
    const dates = selectedDates[month] || []
    if (dates.length === 0) return false
    return dates.every(day => hasTask(month, day))
  }

  /** 切换月份选中状态 */
  const toggleMonth = (m: number): void => {
    selectedMonth.value = selectedMonth.value === m ? null : m
    if (selectedMonth.value && !selectedDates[m]) selectedDates[m] = []
  }

  /** 计算当前选中月份中有任务的日期列表（用于日历标记） */
  const datesWithTasks = computed((): number[] => {
    archiveVersion.value
    const goal = selectedGoal.value as unknown as GoalWithMeta | null
    const goalId = goal?.goal_id
    if (!goalId || selectedMonth.value == null) return []

    const goalMonthsOfGoal = goalMonthsCache[String(goalId)] || []
    const mp = goalMonthsOfGoal.find(
      item => getDateOnlyMonth(item.month) === selectedMonth.value
    )
    if (!mp) return []

    return (goalDaysCache[mp.id] || [])
      .filter(dp => dp.title)
      .map(dp => getDateOnlyDay(dp.day))
      .filter((day): day is number => day !== null)
      .sort((a, b) => a - b)
  })

  /** 选中目标并重置月份和选择器状态 */
  const selectGoal = (g: GoalWithMeta): void => {
    selectedGoal.value = g as unknown as typeof selectedGoal.value
    selectedMonth.value = null
    activePicker.value = 'start'
  }

  return {
    selectedGoal: selectedGoal as unknown as DirectionSelectionReturn['selectedGoal'],
    selectedMonth: selectedMonth as unknown as DirectionSelectionReturn['selectedMonth'],
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
    selectWeekDay,
    isAllSelectedDatesHaveTask
  }
}
