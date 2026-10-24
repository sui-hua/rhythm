// goalBatchStore.ts

import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { GoalMonth } from '@/services/db/goalMonths'
import type { GoalDay } from '@/services/db/goalDays'

/** goal-month 映射表类型：key 为 goal-{goalId}-{month} */
type GoalMonthsMap = Record<string, GoalMonth>
/** 日任务映射表类型：key 为 goal-{goalId}-{month}-{day} */
type DailyTasksMap = Record<string, GoalDay>
/** 批量选中日期类型：key 为月份字符串，value 为日期数组 */
type SelectedDatesMap = Record<string, number[]>

/**
 * 批量编辑状态管理
 * 管理 Direction 模块中批量编辑日计划时的选中状态和缓存数据
 */
export const useGoalBatchStore = defineStore('goalBatch', () => {
  // ── 状态 ──
  // goal-month 映射表，缓存已加载的月度计划，避免重复请求
  const goalMonthsMap = reactive<GoalMonthsMap>({})
  // 日任务映射表，缓存已加载的日计划数据
  const dailyTasks = reactive<DailyTasksMap>({})
  // 批量选中的日期，key 为月份，value 为该月选中的日期数组
  const selectedDates = reactive<SelectedDatesMap>({})
  // 批量编辑输入内容，用户填写的任务描述文本
  const batchInput = ref<string>('')

  // ── Actions ──
  // 重置所有批量编辑状态，关闭批量编辑面板或切换目标时调用
  const reset = (): void => {
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
