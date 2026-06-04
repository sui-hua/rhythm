// 批量编辑状态：月度计划映射、日任务映射、选中日期、批量输入
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useGoalBatchStore = defineStore('goalBatch', () => {
  // goal-month 映射表：key 为 goal-{goalId}-{month}
  const goalMonthsMap = reactive({})
  // 日任务映射表：key 为 goal-{goalId}-{month}-{day}
  const dailyTasks = reactive({})
  // 批量选中的日期：key 为月份，value 为日期数组
  const selectedDates = reactive({})
  // 批量编辑输入内容
  const batchInput = ref('')

  // 重置所有批量编辑状态
  const reset = () => {
    Object.keys(goalMonthsMap).forEach(key => delete goalMonthsMap[key])
    Object.keys(dailyTasks).forEach(key => delete dailyTasks[key])
    Object.keys(selectedDates).forEach(key => delete selectedDates[key])
    batchInput.value = ''
  }

  return {
    goalMonthsMap, dailyTasks, selectedDates, batchInput,
    reset
  }
})
