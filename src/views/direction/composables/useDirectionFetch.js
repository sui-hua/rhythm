import { computed, watch, ref, toRefs } from 'vue'
import { db } from '@/services/database'
import { parseDateOnly, getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import { storeToRefs } from 'pinia'

// 模块级守卫：确保 watchers 全局只注册一次，避免 4 个调用点产生 12 个重复 watcher
let watchersRegistered = false
// 模块级定时器引用：防止 showAddModal 短时间内多次关闭导致定时器累积
let showAddModalTimer = null

const resolveDefaultGoalMonth = (list) => {
  const sorted = list
    .map(gm => ({
      item: gm,
      month: getDateOnlyMonth(gm.month)
    }))
    .filter(({ month }) => month !== null)
    .sort((a, b) => a.month - b.month)

  if (sorted.length === 0) return null

  const currentMonth = new Date().getMonth() + 1
  const current = sorted.find(({ month }) => month === currentMonth)

  return current?.item || sorted[0].item
}

export { parseDateOnly } from '@/views/direction/utils/dateOnly'

export function useDirectionFetch() {
  const dataStore = useGoalDataStore()
  const selectionStore = useGoalSelectionStore()
  const batchStore = useGoalBatchStore()
  const pageStateStore = usePageStateStore()

  const {
    goals, goalMonths, initialized
  } = storeToRefs(dataStore)
  const {
    selectedGoal, editingGoal, selectedMonth
  } = storeToRefs(selectionStore)
  const { showAddModal } = toRefs(pageStateStore.state.direction)

  // 初始化锁：仅在 fetchData 执行期间为 true，阻止 watcher 触发冗余请求
  let isInitializing = false
  // 页面加载状态：控制 loading 展示，每次调用创建独立实例
  const isPageLoading = ref(false)

  // 按分类分组目标列表，用于侧边栏分类展示
  const categorizedGoals = computed(() => {
    const map = new Map()
    for (const goal of goals.value) {
      const categoryName = goal.goal_categories?.name || '未分类'
      if (!map.has(categoryName)) map.set(categoryName, [])

      map.get(categoryName).push({
        ...goal,
        name: goal.title,
        goal_id: goal.id,
        category_name: categoryName
      })
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
  })

  // 重新加载目标列表
  const loadGoals = async () => {
    goals.value = await db.goal.list()
  }

  // 加载指定目标的月度计划并填充缓存和映射表
  const loadGoalMonths = async (goalId) => {
    if (dataStore.goalMonthsCache[goalId]) return
    dataStore.goalMonthsCache[goalId] = await db.goalMonths.list(goalId)

    for (const gm of dataStore.goalMonthsCache[goalId]) {
      const month = getDateOnlyMonth(gm.month)
      if (month) {
        const key = `goal-${goalId}-${month}`
        batchStore.goalMonthsMap[key] = gm
      }
    }

    dataStore.syncGoalMonthsToFlatList(goalId)
  }

  // 加载指定月度计划的日计划并同步到 dailyTasks 映射
  const loadGoalDays = async (monthPlanId, { force = false } = {}) => {
    if (!force && dataStore.goalDaysCache[monthPlanId]) return

    const gd = await db.goalDays.list(monthPlanId)
    dataStore.goalDaysCache[monthPlanId] = gd

    const gm = Object.values(dataStore.goalMonthsCache)
      .flat()
      .find(item => item.id === monthPlanId)
    if (!gm) return

    const monthDate = parseDateOnly(gm.month)
    if (!monthDate) return

    const month = monthDate.getMonth() + 1
    const prefix = `goal-${gm.goal_id}-${month}-`
    for (const key of Object.keys(batchStore.dailyTasks)) {
      if (key.startsWith(prefix)) delete batchStore.dailyTasks[key]
    }

    for (const item of gd) {
      const dayDate = parseDateOnly(item.day)
      if (!dayDate) continue

      const day = dayDate.getDate()
      batchStore.dailyTasks[`goal-${gm.goal_id}-${month}-${day}`] = item
    }
  }

  // 页面初始化数据拉取：加载目标 → 月度计划 → 日计划
  const fetchData = async () => {
    isPageLoading.value = true
    isInitializing = true
    try {
      goals.value = await db.goal.list()

      if (goals.value.length > 0) {
        selectedGoal.value = categorizedGoals.value[0]?.items[0] || null
      }

      if (selectedGoal.value) {
        await loadGoalMonths(selectedGoal.value.goal_id)
        goalMonths.value = dataStore.goalMonthsCache[selectedGoal.value.goal_id] || []
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

    // 新增弹窗关闭时延迟清空编辑状态，避免闪烁
    watch(showAddModal, (val) => {
      if (!val) {
        // 清除前一个定时器，防止短时间内多次关闭导致定时器累积
        if (showAddModalTimer) clearTimeout(showAddModalTimer)
        showAddModalTimer = setTimeout(() => { editingGoal.value = null }, 300)
      }
    })

    // 月份切换时重新加载对应日计划
    watch(selectedMonth, async (newMonth, oldMonth) => {
      if (isInitializing) return
      if (!newMonth || newMonth === oldMonth) return
      if (!selectedGoal.value) return

      const goalId = selectedGoal.value.goal_id
      if (!goalId) return

      const cached = dataStore.goalMonthsCache[goalId] || []
      const gm = cached.find(item => getDateOnlyMonth(item.month) === newMonth)
      if (!gm) return

      dataStore.clearGoalDaysCache(gm.id)
      await loadGoalDays(gm.id, { force: true })
    })

    // 目标切换时重新加载月度计划和默认日计划
    watch(selectedGoal, async (newGoal, oldGoal) => {
      if (isInitializing) return
      if (!newGoal || newGoal === oldGoal) return

      const goalId = newGoal.goal_id
      if (!goalId) return

      await loadGoalMonths(goalId)
      goalMonths.value = dataStore.goalMonthsCache[goalId] || []

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
