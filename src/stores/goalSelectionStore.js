// 目标选择状态：当前选中目标、编辑目标、选中月份、选择器状态
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGoalSelectionStore = defineStore('goalSelection', () => {
  // 当前选中的目标
  const selectedGoal = ref(null)
  // 正在编辑的目标
  const editingGoal = ref(null)
  // 当前选中的月份
  const selectedMonth = ref(null)
  // 日期选择器激活面板（start / end）
  const activePicker = ref('start')
  // 是否正在拖选日期
  const isSelecting = ref(false)

  // 重置所有选择状态
  const reset = () => {
    selectedGoal.value = null
    editingGoal.value = null
    selectedMonth.value = null
    activePicker.value = 'start'
    isSelecting.value = false
  }

  return {
    selectedGoal, editingGoal, selectedMonth, activePicker, isSelecting,
    reset
  }
})
