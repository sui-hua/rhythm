/**
 * ============================================
 * Direction 模块共享状态 Composable (views/direction/composables/useDirectionState.js)
 * ============================================
 *
 * 【模块职责】
 * - 提供 Direction 模块全局共享状态的访问接口
 * - 内部使用 directionStore (Pinia)
 * - 保持与旧版 module-level export 的向后兼容
 *
 * 【使用方式】
 * import { plans, selectedGoal } from '@/views/direction/composables/useDirectionState'
 * // 或者
 * const { plans, selectedGoal } = useDirectionState()
 */
import { useDirectionStore, months } from '@/stores/directionStore'

// ============ 向后兼容的模块级导出 ============
// 这些导出保持与原有代码的兼容性，但实际从 store 读取

export { months }

export const getMonthlyPlansByPlanId = (planId) => useDirectionStore().getMonthlyPlansByPlanId(planId)
export const clearDailyPlansCache = (keepMonthlyPlanId) => useDirectionStore().clearDailyPlansCache(keepMonthlyPlanId)
export const syncMonthlyPlansToFlatList = (planId) => useDirectionStore().syncMonthlyPlansToFlatList(planId)

// Composable 函数
export function useDirectionState() {
  const store = useDirectionStore()

  return {
    // 缓存（只读引用）
    monthlyPlansCache: store.monthlyPlansCache,
    dailyPlansCache: store.dailyPlansCache,
    archiveVersion: store.archiveVersion,

    // 状态
    plans: store.plans,
    monthlyPlans: store.monthlyPlans,
    selectedGoal: store.selectedGoal,
    editingGoal: store.editingGoal,
    selectedMonth: store.selectedMonth,
    activePicker: store.activePicker,
    isSelecting: store.isSelecting,
    showAddModal: store.showAddModal,
    showCategoryModal: store.showCategoryModal,

    // UI 数据
    monthlyMainGoals: store.monthlyMainGoals,
    dailyTasks: store.dailyTasks,
    selectedDates: store.selectedDates,
    batchInput: store.batchInput,

    // 初始化状态
    initialized: store.initialized,

    // 共享分类
    categories: store.categories,

    // 方法
    getMonthlyPlansByPlanId: store.getMonthlyPlansByPlanId,
    clearDailyPlansCache: store.clearDailyPlansCache,
    syncMonthlyPlansToFlatList: store.syncMonthlyPlansToFlatList,

    // reset 方法
    reset: store.reset
  }
}
