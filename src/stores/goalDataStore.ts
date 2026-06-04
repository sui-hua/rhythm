// goalDataStore.ts

import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { getMonthName } from '@/utils/dateFormatter'
import type { Goal } from '@/services/db/goal'
import type { GoalMonth } from '@/services/db/goalMonths'
import type { GoalDay } from '@/services/db/goalDays'
import type { GoalCategory } from '@/types/models'

/** 月份常量项 */
interface MonthItem {
  label: string
  value: number
  full: string
}

// 月份常量列表，供 Direction 模块月份选择器使用
export const months: MonthItem[] = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

/** 按 goalId 缓存的月度计划映射 */
type GoalMonthsCache = Record<string, GoalMonth[]>
/** 按 monthPlanId 缓存的日计划映射 */
type GoalDaysCache = Record<string, GoalDay[]>

/**
 * 目标数据状态管理
 * 管理 goals、月度计划缓存、日计划缓存、分类等 Direction 模块核心数据
 * 使用 reactive 缓存对象避免频繁创建新引用
 */
export const useGoalDataStore = defineStore('goalData', () => {
  // ── 状态 ──
  // 目标列表，包含所有用户创建的目标
  const goals = ref<Goal[]>([])
  // 月度计划扁平列表，兼容旧用法，新代码应优先使用 goalMonthsCache
  const goalMonths = ref<GoalMonth[]>([])
  // 按 goalId 缓存的月度计划，key 格式为 goal-{goalId}-{month}
  const goalMonthsCache = reactive<GoalMonthsCache>({})
  // 按 monthPlanId 缓存的日计划，key 格式为 goal-{goalId}-{month}-{day}
  const goalDaysCache = reactive<GoalDaysCache>({})
  // 归档版本号，每次归档操作递增，触发依赖组件刷新
  const archiveVersion = ref<number>(0)
  // 目标分类列表
  const categories = ref<GoalCategory[]>([])
  // 页面是否已初始化，防止重复加载
  const initialized = ref<boolean>(false)
  // 新增目标弹窗显示状态
  const showAddModal = ref<boolean>(false)
  // 分类管理弹窗显示状态
  const showCategoryModal = ref<boolean>(false)

  // ── 计算属性 / 查询方法 ──
  // 按 goalId 获取缓存的月度计划，不存在时返回空数组
  const getGoalMonthsByGoalId = (goalId: string): GoalMonth[] => goalMonthsCache[goalId] || []

  // ── Actions ──
  // 清空日计划缓存，可选保留指定 monthPlanId 的数据（切换目标时避免闪烁）
  const clearGoalDaysCache = (keepMonthPlanId: string | null = null): void => {
    if (keepMonthPlanId && goalDaysCache[keepMonthPlanId]) {
      // 先暂存要保留的数据，清空后再恢复
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

  // 同步缓存到扁平兼容镜像，确保 goalMonths 与 goalMonthsCache 保持一致
  const syncGoalMonthsToFlatList = (goalId: string): void => {
    const cached = goalMonthsCache[goalId] || []
    const others = goalMonths.value.filter(item => item.goal_id !== goalId)
    goalMonths.value = [...others, ...cached]
  }

  // 重置所有数据状态，退出登录或切换用户时调用
  const reset = (): void => {
    goals.value = []
    goalMonths.value = []
    initialized.value = false
    categories.value = []
    archiveVersion.value = 0
    showAddModal.value = false
    showCategoryModal.value = false
    Object.keys(goalMonthsCache).forEach(key => delete goalMonthsCache[key])
    Object.keys(goalDaysCache).forEach(key => delete goalDaysCache[key])
  }

  return {
    goals, goalMonths, goalMonthsCache, goalDaysCache, archiveVersion,
    categories, initialized, showAddModal, showCategoryModal,
    getGoalMonthsByGoalId, clearGoalDaysCache, syncGoalMonthsToFlatList, reset
  }
})
