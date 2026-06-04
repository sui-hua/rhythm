// 聚合 store：向后兼容旧导入，内部委托给拆分后的子 store
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { getMonthName } from '@/utils/dateFormatter'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import type { Goal } from '@/services/db/goal'
import type { GoalMonth } from '@/services/db/goalMonths'
import type { GoalCategory } from '@/types/models'

/** 月份常量项 */
interface MonthItem {
  label: string
  value: number
  full: string
}

// 月份常量，保持原导出路径不变
export const months: MonthItem[] = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

export const useDirectionStore = defineStore('direction', () => {
  // 获取子 store 实例
  const dataStore = useGoalDataStore()
  const selectionStore = useGoalSelectionStore()
  const batchStore = useGoalBatchStore()
  const pageStateStore = usePageStateStore()

  // ---- 数据状态（委托 goalDataStore）----

  const goals = computed<Goal[]>({
    get: () => dataStore.goals,
    set: (v) => { dataStore.goals = v }
  })

  const goalMonths = computed<GoalMonth[]>({
    get: () => dataStore.goalMonths,
    set: (v) => { dataStore.goalMonths = v }
  })

  const goalMonthsCache = computed(() => dataStore.goalMonthsCache)
  const goalDaysCache = computed(() => dataStore.goalDaysCache)

  const archiveVersion = computed<number>({
    get: () => dataStore.archiveVersion,
    set: (v) => { dataStore.archiveVersion = v }
  })

  const categories = computed<GoalCategory[]>({
    get: () => dataStore.categories,
    set: (v) => { dataStore.categories = v }
  })

  const initialized = computed<boolean>({
    get: () => dataStore.initialized,
    set: (v) => { dataStore.initialized = v }
  })

  // ---- 选择状态（委托 goalSelectionStore）----

  const selectedGoal = computed<Goal | null>({
    get: () => selectionStore.selectedGoal,
    set: (v) => { selectionStore.selectedGoal = v }
  })

  const editingGoal = computed<Goal | null>({
    get: () => selectionStore.editingGoal,
    set: (v) => { selectionStore.editingGoal = v }
  })

  const selectedMonth = computed<number | null>({
    get: () => selectionStore.selectedMonth,
    set: (v) => { selectionStore.selectedMonth = v }
  })

  const activePicker = computed<'start' | 'end'>({
    get: () => selectionStore.activePicker,
    set: (v) => { selectionStore.activePicker = v }
  })

  const isSelecting = computed<boolean>({
    get: () => selectionStore.isSelecting,
    set: (v) => { selectionStore.isSelecting = v }
  })

  // ---- UI 状态（委托 pageStateStore）----

  const showAddModal = computed<boolean>({
    get: () => pageStateStore.state.direction.showAddModal,
    set: (v) => { pageStateStore.state.direction.showAddModal = v }
  })

  const showCategoryModal = computed<boolean>({
    get: () => pageStateStore.state.direction.showCategoryModal,
    set: (v) => { pageStateStore.state.direction.showCategoryModal = v }
  })

  // ---- 批量编辑状态（委托 goalBatchStore）----

  const goalMonthsMap = computed(() => batchStore.goalMonthsMap)
  const dailyTasks = computed(() => batchStore.dailyTasks)
  const selectedDates = computed(() => batchStore.selectedDates)

  const batchInput = computed<string>({
    get: () => batchStore.batchInput,
    set: (v) => { batchStore.batchInput = v }
  })

  // ---- 辅助方法（委托 goalDataStore）----

  const getGoalMonthsByGoalId = (goalId: string): GoalMonth[] => dataStore.getGoalMonthsByGoalId(goalId)
  const clearGoalDaysCache = (keepMonthPlanId: string | null): void => dataStore.clearGoalDaysCache(keepMonthPlanId)
  const syncGoalMonthsToFlatList = (goalId: string): void => dataStore.syncGoalMonthsToFlatList(goalId)

  // 聚合重置：依次重置所有子 store
  const reset = (): void => {
    dataStore.reset()
    selectionStore.reset()
    batchStore.reset()
    pageStateStore.resetAll()
  }

  return {
    // 数据状态
    goals, goalMonths, goalMonthsCache, goalDaysCache, archiveVersion,
    categories, initialized,
    // 选择状态
    selectedGoal, editingGoal, selectedMonth, activePicker, isSelecting,
    // UI 状态
    showAddModal, showCategoryModal,
    // 批量编辑状态
    goalMonthsMap, dailyTasks, selectedDates, batchInput,
    // 辅助方法
    getGoalMonthsByGoalId, clearGoalDaysCache, syncGoalMonthsToFlatList, reset
  }
})
