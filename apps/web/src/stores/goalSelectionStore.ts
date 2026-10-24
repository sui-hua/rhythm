// goalSelectionStore.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GoalWithMeta } from '@/views/direction/types'

/**
 * 目标选择状态管理
 * 管理 Direction 模块中目标选择、编辑、月份切换等 UI 交互状态
 * 与 goalDataStore 分离，避免数据逻辑与 UI 状态耦合
 */
export const useGoalSelectionStore = defineStore('goalSelection', () => {
  // ── 状态 ──
  // 当前选中的目标，用于右侧详情面板展示
  const selectedGoal = ref<GoalWithMeta | null>(null)
  // 正在编辑的目标，编辑弹窗打开时设置
  const editingGoal = ref<GoalWithMeta | null>(null)
  // 当前选中的月份（1-12），用于月度计划视图切换
  const selectedMonth = ref<number | null>(null)
  // 日期选择器激活面板，'start' 为开始日期，'end' 为结束日期
  const activePicker = ref<'start' | 'end'>('start')
  // 是否正在拖选日期，拖选过程中禁用其他交互
  const isSelecting = ref(false)

  // ── Actions ──
  // 重置所有选择状态，切换目标或退出编辑时调用
  const reset = (): void => {
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
