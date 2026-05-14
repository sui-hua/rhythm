import { ref, reactive } from 'vue'
import { getMonthName } from '@/utils/dateFormatter'

export const months = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

// 按 goalId 索引的月度计划缓存
export const goalMonthsCache = reactive({}) // { [goalId]: goalMonth[] }
export const goalDaysCache = reactive({})   // { [monthPlanId]: goalDay[] }
export const archiveVersion = ref(0)
export const getGoalMonthsByGoalId = (goalId) => goalMonthsCache[goalId] || []

// 清空日计划缓存（保留指定的 monthPlanId）
export const clearGoalDaysCache = (keepMonthPlanId = null) => {
  if (keepMonthPlanId && goalDaysCache[keepMonthPlanId]) {
    const keepData = goalDaysCache[keepMonthPlanId]
    Object.keys(goalDaysCache).forEach(key => {
      delete goalDaysCache[key]
    })
    goalDaysCache[keepMonthPlanId] = keepData
  } else {
    Object.keys(goalDaysCache).forEach(key => {
      delete goalDaysCache[key]
    })
  }
}

// 同步缓存到扁平兼容镜像
export const syncGoalMonthsToFlatList = (goalId) => {
  const cached = goalMonthsCache[goalId] || []
  const others = goalMonths.value.filter(item => item.goal_id !== goalId)
  goalMonths.value = [...others, ...cached]
}

// 共享状态（单例）
export const goals = ref([])
export const goalMonths = ref([])

export const selectedGoal = ref(null)
export const editingGoal = ref(null)

export const selectedMonth = ref(null)
export const activePicker = ref('start')
export const isSelecting = ref(false)
export const showAddModal = ref(false)
export const showCategoryModal = ref(false)


export const goalMonthsMap = reactive({})
export const dailyTasks = reactive({})
export const selectedDates = reactive({})
export const batchInput = ref('')

export const initialized = ref(false)

// 共享的分类数据（用于去重请求）
export const categories = ref([])
