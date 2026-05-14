import { defineStore } from 'pinia'
import { getMonthName } from '@/utils/dateFormatter'
import {
  goals,
  goalMonths,
  goalMonthsCache,
  goalDaysCache,
  archiveVersion,
  selectedGoal,
  editingGoal,
  selectedMonth,
  activePicker,
  isSelecting,
  showAddModal,
  showCategoryModal,
  goalMonthsMap,
  dailyTasks,
  selectedDates,
  batchInput,
  initialized,
  categories,
  getGoalMonthsByGoalId,
  clearGoalDaysCache,
  syncGoalMonthsToFlatList
} from '@/views/direction/composables/useDirectionState'

export const months = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

export const useDirectionStore = defineStore('direction', () => {
  const reset = () => {
    goals.value = []
    goalMonths.value = []
    editingGoal.value = null
    selectedGoal.value = null
    selectedMonth.value = null
    activePicker.value = 'start'
    isSelecting.value = false
    showAddModal.value = false
    showCategoryModal.value = false
    initialized.value = false
    categories.value = []

    Object.keys(goalMonthsCache).forEach(key => delete goalMonthsCache[key])
    Object.keys(goalDaysCache).forEach(key => delete goalDaysCache[key])
    Object.keys(goalMonthsMap).forEach(key => delete goalMonthsMap[key])
    Object.keys(dailyTasks).forEach(key => delete dailyTasks[key])
    Object.keys(selectedDates).forEach(key => delete selectedDates[key])
    batchInput.value = ''
    archiveVersion.value = 0
  }

  return {
    goalMonthsCache,
    goalDaysCache,
    archiveVersion,
    goals,
    goalMonths,
    selectedGoal,
    editingGoal,
    selectedMonth,
    activePicker,
    isSelecting,
    showAddModal,
    showCategoryModal,
    goalMonthsMap,
    dailyTasks,
    selectedDates,
    batchInput,
    initialized,
    categories,
    getGoalMonthsByGoalId,
    clearGoalDaysCache,
    syncGoalMonthsToFlatList,
    reset
  }
}, { persist: false })
