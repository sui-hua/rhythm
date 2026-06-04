// useDirectionFetch.ts
// Direction 模块数据拉取与状态联动的核心 Composable

import { computed, watch, ref } from 'vue'
import { db } from '@/services/database'
import { parseDateOnly, getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { storeToRefs } from 'pinia'
import type { GoalMonth } from '@/services/db/goalMonths'
import type { GoalWithMeta, CategorizedGoalGroup, DirectionFetchReturn } from '@/views/direction/types'

// 模块级守卫：watchers 全局只注册一次，避免多个调用点产生重复 watcher
let watchersRegistered = false
// 模块级定时器引用：防止弹窗短时间内多次关闭导致定时器累积
let showAddModalTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 从月度计划列表中解析默认选中的月份计划
 *
 * 优先选择当前月份对应的计划；若不存在则回退到排序最小的计划。
 * null 表示列表为空，调用方需做空值保护。
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

/**
 * Direction 数据拉取与状态联动
 *
 * 使用场景：Direction 模块页面初始化、目标/月份切换时的数据加载
 * 数据流：Supabase → goalDataStore / goalSelectionStore / goalBatchStore → 组件
 */
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

  // store 缓存引用，类型已在 store 定义中对齐
  const goalMonthsCache = dataStore.goalMonthsCache
  const goalDaysCache = dataStore.goalDaysCache
  const goalMonthsMap = batchStore.goalMonthsMap
  const dailyTasks = batchStore.dailyTasks

  // 初始化锁：仅在 fetchData 执行期间为 true，阻止 watcher 触发冗余请求
  let isInitializing = false
  // 页面加载状态：控制 loading 展示，每次 composable 调用创建独立实例
  const isPageLoading = ref(false)

  // 按分类分组目标列表，用于侧边栏分组展示
  const categorizedGoals = computed((): CategorizedGoalGroup[] => {
    const map = new Map<string, GoalWithMeta[]>()
    for (const goal of goals.value) {
      const categoryName = goal.goal_categories?.name || '未分类'
      if (!map.has(categoryName)) map.set(categoryName, [])

      map.get(categoryName)!.push({
        ...goal,
        name: goal.title,
        goal_id: goal.id,
        category_name: categoryName
      })
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
  })

  // 重新加载目标列表，供外部手动刷新使用
  const loadGoals = async (): Promise<void> => {
    goals.value = await db.goal.list()
  }

  // 加载指定目标的月度计划，有缓存时跳过网络请求
  // 同时填充 goalMonthsMap 映射表，供 batchStore 批量操作使用
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

  // 加载指定月度计划的日计划并同步到 dailyTasks 映射
  // force=true 时跳过缓存，用于月份切换后强制刷新
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
    // 先清除该目标-月份前缀下的旧映射，防止残留脏数据
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

  // 页面初始化数据拉取：目标 → 月度计划 → 日计划，按层级顺序加载
  const fetchData = async (): Promise<void> => {
    isPageLoading.value = true
    isInitializing = true
    try {
      goals.value = await db.goal.list()

      if (goals.value.length > 0) {
        selectedGoal.value = categorizedGoals.value[0]?.items[0] || null
      }

      if (selectedGoal.value) {
        await loadGoalMonths(String(selectedGoal.value.goal_id))
        goalMonths.value = goalMonthsCache[String(selectedGoal.value.goal_id)] || []
      }

      if (selectedGoal.value && goalMonths.value.length > 0) {
        const targetGm = resolveDefaultGoalMonth(goalMonths.value)
        const targetMonth = targetGm ? getDateOnlyMonth(targetGm.month) : null

        if (targetGm && targetMonth) {
          selectedMonth.value = targetMonth
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

    // 弹窗关闭时延迟清空编辑状态，300ms 延迟避免关闭动画期间闪烁
    watch(showAddModal, (val: boolean) => {
      if (!val) {
        if (showAddModalTimer) clearTimeout(showAddModalTimer)
        showAddModalTimer = setTimeout(() => { editingGoal.value = null }, 300)
      }
    })

    // 月份切换时重新加载对应日计划，初始化期间跳过避免与 fetchData 冲突
    watch(selectedMonth, async (newMonth: number | null, oldMonth: number | null) => {
      if (isInitializing) return
      if (!newMonth || newMonth === oldMonth) return
      if (!selectedGoal.value) return

      const goalId = String(selectedGoal.value.goal_id)
      if (!goalId) return

      const cached = goalMonthsCache[goalId] || []
      const gm = cached.find(item => getDateOnlyMonth(item.month) === newMonth)
      if (!gm) return

      dataStore.clearGoalDaysCache(gm.id)
      await loadGoalDays(gm.id, { force: true })
    })

    // 目标切换时重新加载月度计划，并自动选中默认月份的日计划
    watch(selectedGoal, async (newGoal, oldGoal) => {
      if (isInitializing) return
      if (!newGoal || newGoal === oldGoal) return

      const goalId = String(newGoal.goal_id)
      if (!goalId) return

      await loadGoalMonths(goalId)
      goalMonths.value = goalMonthsCache[goalId] || []

      if (goalMonths.value.length > 0) {
        const targetGm = resolveDefaultGoalMonth(goalMonths.value)
        const targetMonth = targetGm ? getDateOnlyMonth(targetGm.month) : null

        if (targetGm && targetMonth) {
          selectedMonth.value = targetMonth
          await loadGoalDays(targetGm.id, { force: true })
        }
      }
    })
  }

  // 首次调用时触发页面初始化数据拉取，后续调用复用已加载数据
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
