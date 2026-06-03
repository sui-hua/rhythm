import { computed, watch, ref } from 'vue'
import { db } from '@/services/database'
import { parseDateOnly, getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { useDirectionStore } from '@/stores/directionStore'
import { storeToRefs } from 'pinia'

let isInitializing = false
let hooksSetup = false
const isPageLoading = ref(false)

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
  const store = useDirectionStore()
  const {
    goals, goalMonths, selectedGoal, editingGoal, showAddModal, initialized, selectedMonth
  } = storeToRefs(store)

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

  const loadGoals = async () => {
    goals.value = await db.goal.list()
  }

  const loadGoalMonths = async (goalId) => {
    if (store.goalMonthsCache[goalId]) return
    store.goalMonthsCache[goalId] = await db.goalMonths.list(goalId)

    for (const gm of store.goalMonthsCache[goalId]) {
      const month = getDateOnlyMonth(gm.month)
      if (month) {
        const key = `goal-${goalId}-${month}`
        store.goalMonthsMap[key] = gm
      }
    }

    store.syncGoalMonthsToFlatList(goalId)
  }

  const loadGoalDays = async (monthPlanId, { force = false } = {}) => {
    if (!force && store.goalDaysCache[monthPlanId]) return

    const gd = await db.goalDays.list(monthPlanId)
    store.goalDaysCache[monthPlanId] = gd

    const gm = Object.values(store.goalMonthsCache)
      .flat()
      .find(item => item.id === monthPlanId)
    if (!gm) return

    const monthDate = parseDateOnly(gm.month)
    if (!monthDate) return

    const month = monthDate.getMonth() + 1
    const prefix = `goal-${gm.goal_id}-${month}-`
    for (const key of Object.keys(store.dailyTasks)) {
      if (key.startsWith(prefix)) delete store.dailyTasks[key]
    }

    for (const item of gd) {
      const dayDate = parseDateOnly(item.day)
      if (!dayDate) continue

      const day = dayDate.getDate()
      store.dailyTasks[`goal-${gm.goal_id}-${month}-${day}`] = item
    }
  }

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
        goalMonths.value = store.goalMonthsCache[selectedGoal.value.goal_id] || []
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

  if (!hooksSetup) {
    hooksSetup = true

    watch(showAddModal, (val) => {
      if (!val) {
        setTimeout(() => { editingGoal.value = null }, 300)
      }
    })

    watch(selectedMonth, async (newMonth, oldMonth) => {
      if (isInitializing) return
      if (!newMonth || newMonth === oldMonth) return
      if (!selectedGoal.value) return

      const goalId = selectedGoal.value.goal_id
      if (!goalId) return

      const cached = store.goalMonthsCache[goalId] || []
      const gm = cached.find(item => getDateOnlyMonth(item.month) === newMonth)
      if (!gm) return

      store.clearGoalDaysCache(gm.id)
      await loadGoalDays(gm.id, { force: true })
    })

    watch(selectedGoal, async (newGoal, oldGoal) => {
      if (isInitializing) return
      if (!newGoal || newGoal === oldGoal) return

      const goalId = newGoal.goal_id
      if (!goalId) return

      await loadGoalMonths(goalId)
      goalMonths.value = store.goalMonthsCache[goalId] || []

      if (goalMonths.value.length > 0) {
        const targetGm = resolveDefaultGoalMonth(goalMonths.value)
        const targetMonth = targetGm ? getDateOnlyMonth(targetGm.month) : null

        if (targetGm && targetMonth) {
          selectedMonth.value = targetMonth
          await loadGoalDays(targetGm.id, { force: true })
        }
      }
    })

    if (!initialized.value) {
      fetchData()
      initialized.value = true
    }
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
