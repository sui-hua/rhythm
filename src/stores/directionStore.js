/**
 * ============================================
 * Direction 状态管理 (stores/directionStore.js)
 * ============================================
 *
 * @description
 * 管理 Direction 模块的全局共享状态（Pinia store）。
 * Direction 模块用于长期目标管理，采用三级级联结构：
 *   Plans（长期目标）→ MonthlyPlans（月度计划）→ DailyPlans（每日任务）
 *
 * @module stores/directionStore
 *
 * 【数据结构】
 * - plans              {Array}    长期目标列表
 * - monthlyPlans       {Array}    月度计划列表（扁平兼容格式）
 * - monthlyPlansCache  {Object}   按 planId 索引的月度计划缓存 { [planId]: monthlyPlan[] }
 * - dailyPlansCache    {Object}   按 monthlyPlanId 索引的日计划缓存 { [monthlyPlanId]: dailyPlan[] }
 * - selectedGoal       {Object|null} 当前选中的目标
 * - editingGoal        {Object|null} 当前编辑的目标
 * - selectedMonth      {Number|null} 当前选中的月份 (1-12)
 * - selectedDates      {Object}   当前选中的日期集合 { [date: string]: boolean }
 *
 * 【缓存策略】
 * 为解决多组件并发请求导致的数据覆盖问题，采用以下缓存机制：
 * - monthlyPlansCache: 按 planId 存储月度计划，避免重复请求
 * - dailyPlansCache: 按 monthlyPlanId 存储日计划，支持按月筛选
 * - syncMonthlyPlansToFlatList(): 将缓存数据同步到扁平列表（兼容旧接口）
 * - clearDailyPlansCache(): 清空日计划缓存，可选择保留指定月度计划
 *
 * @see {@link https://github.com/nickhsine/static-rhythm/wiki/Direction-Module} 模块详情
 */
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { getMonthName } from '@/utils/dateFormatter'

// 月份常量定义（动态生成）
export const months = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

export const useDirectionStore = defineStore('direction', () => {
  // ============ 缓存主源（按 planId 索引的月度计划）============
  const monthlyPlansCache = reactive({}) // { [planId]: monthlyPlan[] }
  const dailyPlansCache = reactive({})   // { [monthlyPlanId]: dailyPlan[] }

  // 归档版本号（用于触发归档列表更新）
  const archiveVersion = ref(0)

  // ============ 共享状态 ============
  const plans = ref([])
  const monthlyPlans = ref([])

  const selectedGoal = ref(null)
  const editingGoal = ref(null)

  const selectedMonth = ref(null)
  const activePicker = ref('start')
  const isSelecting = ref(false)
  const showAddModal = ref(false)
  const showCategoryModal = ref(false)

  // UI 数据
  const monthlyMainGoals = reactive({})
  const dailyTasks = reactive({})
  const selectedDates = reactive({})
  const batchInput = ref('')

  const initialized = ref(false)

  // 共享的分类数据（用于去重请求）
  const categories = ref([])

  // ============ 计算属性 ============

  // ============ 缓存操作 ============

  /**
   * 按 planId 获取月度计划列表
   *
   * @description
   * 从 monthlyPlansCache 中查找指定 planId 对应的月度计划列表。
   * 若缓存中不存在该 planId，则返回空数组。
   *
   * @param {string|number} planId - 目标 ID
   * @returns {Array} 该 planId 关联的月度计划列表，若无则返回空数组
   *
   * @example
   * const plans = getMonthlyPlansByPlanId(123)
   */
  const getMonthlyPlansByPlanId = (planId) => monthlyPlansCache[planId] || []

  /**
   * 清空日计划缓存
   *
   * @description
   * 清除 dailyPlansCache 中的所有数据。
   * 可选保留指定的 monthlyPlanId 对应的数据，避免正在使用的日计划被清除。
   *
   * @param {string|number|null} [keepMonthlyPlanId=null] - 要保留的月度计划 ID
   * @returns {void}
   *
   * @example
   * // 清空所有日计划缓存
   * clearDailyPlansCache()
   *
   * @example
   * // 保留指定月度计划的日计划
   * clearDailyPlansCache(456)
   */
  const clearDailyPlansCache = (keepMonthlyPlanId = null) => {
    if (keepMonthlyPlanId && dailyPlansCache[keepMonthlyPlanId]) {
      const keepData = dailyPlansCache[keepMonthlyPlanId]
      Object.keys(dailyPlansCache).forEach(key => {
        delete dailyPlansCache[key]
      })
      dailyPlansCache[keepMonthlyPlanId] = keepData
    } else {
      Object.keys(dailyPlansCache).forEach(key => {
        delete dailyPlansCache[key]
      })
    }
  }

  /**
   * 同步缓存数据到月度计划扁平列表
   *
   * @description
   * 将 monthlyPlansCache[planId] 中的数据同步到 monthlyPlans 扁平列表中。
   * 同步策略：保留其他 planId 的数据，只更新指定 planId 的数据。
   * 用于保持缓存与旧接口的兼容性。
   *
   * @param {string|number} planId - 目标 ID
   * @returns {void}
   *
   * @example
   * syncMonthlyPlansToFlatList(123)
   */
  const syncMonthlyPlansToFlatList = (planId) => {
    const cached = monthlyPlansCache[planId] || []
    const others = monthlyPlans.value.filter(item => item.plan_id !== planId)
    monthlyPlans.value = [...others, ...cached]
  }

  // ============ 重置 ============

  /**
   * 重置所有状态到初始值
   *
   * @description
   * 清除所有状态、缓存和 UI 数据，将 store 恢复到初始未加载状态。
   * 主要用于用户登出或切换账户时清理状态。
   *
   * @returns {void}
   *
   * @example
   * const directionStore = useDirectionStore()
   * directionStore.reset()
   */
  const reset = () => {
    plans.value = []
    monthlyPlans.value = []
    editingGoal.value = null
    selectedGoal.value = null
    selectedMonth.value = null
    activePicker.value = 'start'
    isSelecting.value = false
    showAddModal.value = false
    showCategoryModal.value = false
    initialized.value = false
    categories.value = []

    // 清空缓存
    Object.keys(monthlyPlansCache).forEach(key => delete monthlyPlansCache[key])
    Object.keys(dailyPlansCache).forEach(key => delete dailyPlansCache[key])
    Object.keys(monthlyMainGoals).forEach(key => delete monthlyMainGoals[key])
    Object.keys(dailyTasks).forEach(key => delete dailyTasks[key])
    Object.keys(selectedDates).forEach(key => delete selectedDates[key])
    batchInput.value = ''
    archiveVersion.value = 0
  }

  return {
    // 缓存
    monthlyPlansCache,
    dailyPlansCache,
    archiveVersion,

    // 状态
    plans,
    monthlyPlans,
    selectedGoal,
    editingGoal,
    selectedMonth,
    activePicker,
    isSelecting,
    showAddModal,
    showCategoryModal,
    monthlyMainGoals,
    dailyTasks,
    selectedDates,
    batchInput,
    initialized,
    categories,

    // 缓存操作
    getMonthlyPlansByPlanId,
    clearDailyPlansCache,
    syncMonthlyPlansToFlatList,

    // 操作
    reset
  }
}, { persist: false })
