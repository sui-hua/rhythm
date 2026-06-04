// 目标数据状态：goals、月度计划缓存、日计划缓存、分类、归档版本
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { Goal } from '@/services/db/goal'
import type { GoalMonth } from '@/services/db/goalMonths'
import type { GoalDay } from '@/services/db/goalDays'
import type { GoalCategory } from '@/types/models'

/** 按 goalId 缓存的月度计划映射 */
type GoalMonthsCache = Record<string, GoalMonth[]>
/** 按 monthPlanId 缓存的日计划映射 */
type GoalDaysCache = Record<string, GoalDay[]>

export const useGoalDataStore = defineStore('goalData', () => {
  // 目标列表
  const goals = ref<Goal[]>([])
  // 月度计划扁平列表（兼容旧用法）
  const goalMonths = ref<GoalMonth[]>([])
  // 按 goalId 缓存的月度计划
  const goalMonthsCache = reactive<GoalMonthsCache>({})
  // 按 monthPlanId 缓存的日计划
  const goalDaysCache = reactive<GoalDaysCache>({})
  // 归档版本号，变更时递增触发依赖刷新
  const archiveVersion = ref<number>(0)
  // 目标分类列表
  const categories = ref<GoalCategory[]>([])
  // 页面是否已初始化
  const initialized = ref<boolean>(false)

  // 按 goalId 获取缓存的月度计划
  const getGoalMonthsByGoalId = (goalId: string): GoalMonth[] => goalMonthsCache[goalId] || []

  // 清空日计划缓存（保留指定的 monthPlanId）
  const clearGoalDaysCache = (keepMonthPlanId: string | null = null): void => {
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
  const syncGoalMonthsToFlatList = (goalId: string): void => {
    const cached = goalMonthsCache[goalId] || []
    const others = goalMonths.value.filter(item => item.goal_id !== goalId)
    goalMonths.value = [...others, ...cached]
  }

  // 重置所有数据状态
  const reset = (): void => {
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
