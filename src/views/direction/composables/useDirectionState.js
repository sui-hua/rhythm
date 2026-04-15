/**
 * 方向模块共享状态 (useDirectionState.js)
 * 所有 composables 之间共享的响应式状态和缓存，是方向模块的数据中心。
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
