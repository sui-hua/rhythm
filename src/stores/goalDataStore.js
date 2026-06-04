// 目标数据状态：goals、月度计划缓存、日计划缓存、分类、归档版本
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useGoalDataStore = defineStore('goalData', () => {
  // 目标列表
  const goals = ref([])
  // 月度计划扁平列表（兼容旧用法）
  const goalMonths = ref([])
  // 按 goalId 缓存的月度计划
  const goalMonthsCache = reactive({})
  // 按 monthPlanId 缓存的日计划
  const goalDaysCache = reactive({})
  // 归档版本号，变更时递增触发依赖刷新
  const archiveVersion = ref(0)
  // 目标分类列表
  const categories = ref([])
  // 页面是否已初始化
  const initialized = ref(false)

  // 按 goalId 获取缓存的月度计划
  const getGoalMonthsByGoalId = (goalId) => goalMonthsCache[goalId] || []

  // 清空日计划缓存（保留指定的 monthPlanId）
  const clearGoalDaysCache = (keepMonthPlanId = null) => {
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
  const syncGoalMonthsToFlatList = (goalId) => {
    const cached = goalMonthsCache[goalId] || []
    const others = goalMonths.value.filter(item => item.goal_id !== goalId)
    goalMonths.value = [...others, ...cached]
  }

  // 重置所有数据状态
  const reset = () => {
    goals.value = []
    goalMonths.value = []
    initialized.value = false
    categories.value = []
    archiveVersion.value = 0
    Object.keys(goalMonthsCache).forEach(key => delete goalMonthsCache[key])
    Object.keys(goalDaysCache).forEach(key => delete goalDaysCache[key])
  }

  return {
    goals, goalMonths, goalMonthsCache, goalDaysCache, archiveVersion,
    categories, initialized,
    getGoalMonthsByGoalId, clearGoalDaysCache, syncGoalMonthsToFlatList, reset
  }
})
