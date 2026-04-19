/**
 * ============================================
 * Direction 状态管理 (stores/directionStore.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理 Direction 模块的全局共享状态（Pinia store）
 * - Direction 模块三级级联结构：
 *   Plans（长期目标）→ MonthlyPlans（月度计划）→ DailyPlans（每日任务）
 * - 提供缓存机制提高性能
 *
 * 【数据结构】
 * - plans           → 长期目标列表
 * - monthlyPlans    → 月度计划列表（扁平兼容格式）
 * - monthlyPlansCache → 按 planId 索引的月度计划缓存
 * - dailyPlansCache → 按 monthlyPlanId 索引的日计划缓存
 * - selectedGoal    → 当前选中的目标
 * - editingGoal     → 当前编辑的目标
 * - selectedMonth   → 当前选中的月份
 * - selectedDates   → 当前选中的日期集合
 *
 * 【缓存机制】
 * - getMonthlyPlansByPlanId() → 按 planId 获取月度计划
 * - syncMonthlyPlansToFlatList() → 同步缓存到扁平列表
 * - clearDailyPlansCache() → 清空日计划缓存
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
   * 按 planId 获取月度计划
   */
  const getMonthlyPlansByPlanId = (planId) => monthlyPlansCache[planId] || []

  /**
   * 清空日计划缓存（保留指定的 monthlyPlanId）
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
   * 同步缓存到扁平兼容镜像
   */
  const syncMonthlyPlansToFlatList = (planId) => {
    const cached = monthlyPlansCache[planId] || []
    const others = monthlyPlans.value.filter(item => item.plan_id !== planId)
    monthlyPlans.value = [...others, ...cached]
  }

  // ============ 重置 ============

  /**
   * 重置所有状态到初始值
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
