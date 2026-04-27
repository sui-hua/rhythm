/**
 * ============================================
 * Direction 模块共享状态 (views/direction/composables/useDirectionState.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理 Direction 模块的全局共享状态
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
 */
import { ref, reactive } from 'vue'
import { getMonthName } from '@/utils/dateFormatter'

// 月份常量定义（动态生成）
export const months = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

// 缓存主源（按 planId 索引的月度计划）
export const monthlyPlansCache = reactive({}) // { [planId]: monthlyPlan[] }
export const dailyPlansCache = reactive({})   // { [monthlyPlanId]: dailyPlan[] }
export const archiveVersion = ref(0)
export const getMonthlyPlansByPlanId = (planId) => monthlyPlansCache[planId] || []

// 清空日计划缓存（保留指定的 monthlyPlanId）
export const clearDailyPlansCache = (keepMonthlyPlanId = null) => {
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

// 同步缓存到扁平兼容镜像
export const syncMonthlyPlansToFlatList = (planId) => {
  const cached = monthlyPlansCache[planId] || []
  const others = monthlyPlans.value.filter(item => item.plan_id !== planId)
  monthlyPlans.value = [...others, ...cached]
}

// 共享状态（单例）
export const plans = ref([])
export const monthlyPlans = ref([])

export const selectedGoal = ref(null)
export const editingGoal = ref(null)

export const selectedMonth = ref(null)
export const activePicker = ref('start')
export const isSelecting = ref(false)
export const showAddModal = ref(false)
export const showCategoryModal = ref(false)


export const monthlyMainGoals = reactive({})
export const dailyTasks = reactive({})
export const selectedDates = reactive({})
export const batchInput = ref('')

export const initialized = ref(false)

// 共享的分类数据（用于去重请求）
export const categories = ref([])
