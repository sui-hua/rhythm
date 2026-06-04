/**
 * Direction 数据拉取 composable。
 * 负责页面初始化时加载目标、月度计划、日计划，
 * 并注册模块级 watcher 响应目标/月份切换。
 */

import { computed, watch, ref } from 'vue'
import { db } from '@/services/database'
import { parseDateOnly, getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { storeToRefs } from 'pinia'
import type { Goal } from '@/services/db/goal'
import type { GoalMonth } from '@/services/db/goalMonths'
import type { GoalDay } from '@/services/db/goalDays'
import type { GoalWithMeta, CategorizedGoalGroup, DirectionFetchReturn } from '@/views/direction/types'

// 模块级守卫：确保 watchers 全局只注册一次，避免 4 个调用点产生 12 个重复 watcher
let watchersRegistered = false
// 模块级定时器引用：防止 showAddModal 短时间内多次关闭导致定时器累积
let showAddModalTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 从月度计划列表中解析出默认选中的月份计划。
 * 优先选择当前月份，否则选第一个排序最小的。
 */
const resolveDefaultGoalMonth = (list: GoalMonth[]): GoalMonth | null => {
  const sorted = list
    .map(gm => ({
      item: gm,
      month: getDateOnlyMonth(gm.month)
    }))
    .filter((entry): entry is { item: GoalMonth; month: number } => entry.month !== null)
    .sort((a, b) => a.month - b.month)

  if (sorted.length === 0) return null

  const currentMonth = new Date().getMonth() + 1
  const current = sorted.find(({ month }) => month === currentMonth)

  return current?.item || sorted[0]!.item
}

export { parseDateOnly } from '@/views/direction/utils/dateOnly'

export function useDirectionFetch(): DirectionFetchReturn {
  const dataStore = useGoalDataStore()
  const selectionStore = useGoalSelectionStore()
  const batchStore = useGoalBatchStore()

  const {
    goals, goalMonths, initialized, showAddModal
  } = storeToRefs(dataStore)
  const {
    selectedGoal, editingGoal, selectedMonth
  } = storeToRefs(selectionStore)

  // 将 store 引用断言为具体类型
  const goalsTyped = goals as unknown as { value: Goal[] }
  const goalMonthsTyped = goalMonths as unknown as { value: GoalMonth[] }
  const selectedGoalTyped = selectedGoal as unknown as { value: GoalWithMeta | null }
  const editingGoalTyped = editingGoal as unknown as { value: GoalWithMeta | null }
  const selectedMonthTyped = selectedMonth as unknown as { value: number | null }

  // 将 store 缓存断言为具体类型
  const goalMonthsCache = dataStore.goalMonthsCache as unknown as Record<string, GoalMonth[]>
  const goalDaysCache = dataStore.goalDaysCache as unknown as Record<string, GoalDay[]>
  const goalMonthsMap = batchStore.goalMonthsMap as unknown as Record<string, GoalMonth>
  const dailyTasks = batchStore.dailyTasks as unknown as Record<string, GoalDay>

  // 初始化锁：仅在 fetchData 执行期间为 true，阻止 watcher 触发冗余请求
  let isInitializing = false
  // 页面加载状态：控制 loading 展示，每次调用创建独立实例
  const isPageLoading = ref(false)

  // 按分类分组目标列表，用于侧边栏分类展示
  const categorizedGoals = computed((): CategorizedGoalGroup[] => {
    const map = new Map<string, GoalWithMeta[]>()
    for (const goal of goalsTyped.value) {
      const categoryName = goal.goal_categories?.name || '未分类'
      if (!map.has(categoryName)) map.set(categoryName, [])

      map.get(categoryName)!.push({
        ...goal,
        name: goal.title,
        goal_id: goal.id,
        category_name: categoryName
      } as GoalWithMeta)
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
  })

  /** 重新加载目标列表 */
  const loadGoals = async (): Promise<void> => {
    goalsTyped.value = await db.goal.list()
  }

  /** 加载指定目标的月度计划并填充缓存和映射表 */
  const loadGoalMonths = async (goalId: string): Promise<void> => {
    if (goalMonthsCache[goalId]) return
    goalMonthsCache[goalId] = await db.goalMonths.list(goalId)

    for (const gm of goalMonthsCache[goalId]) {
      const month = getDateOnlyMonth(gm.month)
      if (month) {
        const key = `goal-${goalId}-${month}`
        goalMonthsMap[key] = gm
      }
    }

    dataStore.syncGoalMonthsToFlatList(goalId)
  }

  /** 加载指定月度计划的日计划并同步到 dailyTasks 映射 */
  const loadGoalDays = async (monthPlanId: string, { force = false } = {}): Promise<void> => {
    if (!force && goalDaysCache[monthPlanId]) return

    const gd = await db.goalDays.list(monthPlanId)
    goalDaysCache[monthPlanId] = gd

    const gm = Object.values(goalMonthsCache)
      .flat()
      .find(item => item.id === monthPlanId)
    if (!gm) return

    const monthDate = parseDateOnly(gm.month)
    if (!monthDate) return

    const month = monthDate.getMonth() + 1
    const prefix = `goal-${gm.goal_id}-${month}-`
    for (const key of Object.keys(dailyTasks)) {
      if (key.startsWith(prefix)) delete dailyTasks[key]
    }

    for (const item of gd) {
      const dayDate = parseDateOnly(item.day)
      if (!dayDate) continue

      const day = dayDate.getDate()
      dailyTasks[`goal-${gm.goal_id}-${month}-${day}`] = item
    }
  }

  /** 页面初始化数据拉取：加载目标 → 月度计划 → 日计划 */
  const fetchData = async (): Promise<void> => {
    isPageLoading.value = true
    isInitializing = true
    try {
      goalsTyped.value = await db.goal.list()

      if (goalsTyped.value.length > 0) {
        selectedGoalTyped.value = categorizedGoals.value[0]?.items[0] || null
      }

      if (selectedGoalTyped.value) {
        await loadGoalMonths(String(selectedGoalTyped.value.goal_id))
        goalMonthsTyped.value = goalMonthsCache[String(selectedGoalTyped.value.goal_id)] || []
      }

      if (selectedGoalTyped.value && goalMonthsTyped.value.length > 0) {
        const targetGm = resolveDefaultGoalMonth(goalMonthsTyped.value)
        const targetMonth = targetGm ? getDateOnlyMonth(targetGm.month) : null

        if (targetGm && targetMonth) {
          selectedMonthTyped.value = targetMonth
          await loadGoalDays(targetGm.id, { force: true })
        }
      }
    } catch (e) {
      console.error('Failed to fetch direction data', e)
    } finally {
      isPageLoading.value = false
      isInitializing = false
    }
  }

  // 模块级守卫：watchers 仅注册一次，避免多个调用点产生重复 watcher
  if (!watchersRegistered) {
    watchersRegistered = true

    // 新增弹窗关闭时延迟清空编辑状态，避免闪烁
    watch(showAddModal, (val: boolean) => {
      if (!val) {
        // 清除前一个定时器，防止短时间内多次关闭导致定时器累积
        if (showAddModalTimer) clearTimeout(showAddModalTimer)
        showAddModalTimer = setTimeout(() => { editingGoalTyped.value = null }, 300)
      }
    })

    // 月份切换时重新加载对应日计划
    watch(selectedMonth, async (newMonth: number | null, oldMonth: number | null) => {
      if (isInitializing) return
      if (!newMonth || newMonth === oldMonth) return
      if (!selectedGoalTyped.value) return

      const goalId = String(selectedGoalTyped.value.goal_id)
      if (!goalId) return

      const cached = goalMonthsCache[goalId] || []
      const gm = cached.find(item => getDateOnlyMonth(item.month) === newMonth)
      if (!gm) return

      dataStore.clearGoalDaysCache(gm.id)
      await loadGoalDays(gm.id, { force: true })
    })

    // 目标切换时重新加载月度计划和默认日计划
    watch(selectedGoal, async (newGoal, oldGoal) => {
      if (isInitializing) return
      if (!newGoal || newGoal === oldGoal) return

      const goal = newGoal as unknown as GoalWithMeta
      const goalId = String(goal.goal_id)
      if (!goalId) return

      await loadGoalMonths(goalId)
      goalMonthsTyped.value = goalMonthsCache[goalId] || []

      if (goalMonthsTyped.value.length > 0) {
        const targetGm = resolveDefaultGoalMonth(goalMonthsTyped.value)
        const targetMonth = targetGm ? getDateOnlyMonth(targetGm.month) : null

        if (targetGm && targetMonth) {
          selectedMonthTyped.value = targetMonth
          await loadGoalDays(targetGm.id, { force: true })
        }
      }
    })
  }

  // 首次调用时触发页面初始化数据拉取
  if (!initialized.value) {
    fetchData()
    initialized.value = true
  }

  return {
    categorizedGoals,
    fetchData,
    isPageLoading,
    loadGoals,
    loadGoalMonths,
    loadGoalDays
  }
}
