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

/**
 * 根据计划 ID 获取该计划下所有月度计划的映射表（缓存）
 * @param {string|number} planId - 计划的唯一标识符
 * @returns {Map<string, import('@/stores/directionStore').MonthlyPlan>} 以月度计划 ID 为键的映射表
 * @see useDirectionStore.getMonthlyPlansByPlanId
 */
export const getMonthlyPlansByPlanId = (planId) => useDirectionStore().getMonthlyPlansByPlanId(planId)

/**
 * 清除日计划缓存，可选择性保留指定月度计划的日计划缓存
 * @param {string|number|null} [keepMonthlyPlanId] - 需要保留缓存的月度计划 ID，传入 null 则清除全部
 * @returns {void}
 * @see useDirectionStore.clearDailyPlansCache
 */
export const clearDailyPlansCache = (keepMonthlyPlanId) => useDirectionStore().clearDailyPlansCache(keepMonthlyPlanId)

/**
 * 将月度计划同步为一个扁平列表（用于 UI 展示）
 * @param {string|number} planId - 计划的唯一标识符
 * @returns {import('@/stores/directionStore').DailyPlan[]} 扁平化后的日计划数组
 * @see useDirectionStore.syncMonthlyPlansToFlatList
 */
export const syncMonthlyPlansToFlatList = (planId) => useDirectionStore().syncMonthlyPlansToFlatList(planId)

/**
 * Direction 模块共享状态 Composable
 *
 * 封装 directionStore 的响应式状态和方法，提供组合式函数调用接口，
 * 同时保持模块级导出的向后兼容性。
 *
 * 【状态分类】
 * - 缓存：monthlyPlansCache, dailyPlansCache, archiveVersion
 * - 核心状态：plans, monthlyPlans, selectedGoal, editingGoal, selectedMonth
 * - UI 状态：activePicker, isSelecting, showAddModal, showCategoryModal
 * - 业务数据：monthlyMainGoals, dailyTasks, selectedDates, batchInput
 * - 分类共享：categories
 *
 * @returns {object} 包含状态和方法的对象，具体字段详见下方返回结构
 */
export function useDirectionState() {
  const store = useDirectionStore()

  return {
    // ============ 缓存（只读引用）==========
    /** @type {Map<string, import('@/stores/directionStore').MonthlyPlan>} 以 planId 为键的月度计划缓存映射 */
    monthlyPlansCache: store.monthlyPlansCache,
    /** @type {Map<string, import('@/stores/directionStore').DailyPlan>} 以 monthlyPlanId 为键的日计划缓存映射 */
    dailyPlansCache: store.dailyPlansCache,
    /** @type {number} 归档版本号，用于缓存失效控制 */
    archiveVersion: store.archiveVersion,

    // ============ 核心状态 ==========
    /** @type {import('@/stores/directionStore').Plan[]} 所有长期计划列表 */
    plans: store.plans,
    /** @type {import('@/stores/directionStore').MonthlyPlan[]} 当前选中的月度计划列表 */
    monthlyPlans: store.monthlyPlans,
    /** @type {import('@/stores/directionStore').Goal|null} 当前选中的目标（主目标） */
    selectedGoal: store.selectedGoal,
    /** @type {import('@/stores/directionStore').Goal|null} 当前正在编辑的目标 */
    editingGoal: store.editingGoal,
    /** @type {string} 当前选中的月份，格式为 'YYYY-MM' */
    selectedMonth: store.selectedMonth,
    /** @type {string|null} 当前激活的日期选择器类型（date/month/quarter） */
    activePicker: store.activePicker,
    /** @type {boolean} 是否处于选择状态（多选模式） */
    isSelecting: store.isSelecting,
    /** @type {boolean} 是否显示新增弹窗 */
    showAddModal: store.showAddModal,
    /** @type {boolean} 是否显示分类弹窗 */
    showCategoryModal: store.showCategoryModal,

    // ============ UI 数据 ==========
    /** @type {import('@/stores/directionStore').Goal[]} 当前月度下的主目标列表 */
    monthlyMainGoals: store.monthlyMainGoals,
    /** @type {import('@/stores/directionStore').DailyPlan[]} 当前日计划列表 */
    dailyTasks: store.dailyTasks,
    /** @type {string[]} 已选中的日期字符串数组（多选模式） */
    selectedDates: store.selectedDates,
    /** @type {string} 批量输入的文本内容 */
    batchInput: store.batchInput,

    // ============ 初始化状态 ==========
    /** @type {boolean} 初始数据是否已加载完成 */
    initialized: store.initialized,

    // ============ 共享分类 ==========
    /** @type {import('@/stores/directionStore').Category[]} 全局分类列表 */
    categories: store.categories,

    // ============ 方法 ==========
    /** @param {string|number} planId @returns {Map<string, import('@/stores/directionStore').MonthlyPlan>} */
    getMonthlyPlansByPlanId: store.getMonthlyPlansByPlanId,
    /** @param {string|number|null} [keepMonthlyPlanId] @returns {void} */
    clearDailyPlansCache: store.clearDailyPlansCache,
    /** @param {string|number} planId @returns {import('@/stores/directionStore').DailyPlan[]} */
    syncMonthlyPlansToFlatList: store.syncMonthlyPlansToFlatList,

    // ============ reset 方法 ==========
    /** @returns {void} 重置模块所有状态到初始值 */
    reset: store.reset
  }
}
