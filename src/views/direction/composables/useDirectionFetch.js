/**
 * 方向模块数据获取 (useDirectionFetch.js)
 * 负责从数据库加载 plans、monthlyPlans、dailyPlans 三层数据，
 * 并通过 monthlyPlansCache / dailyPlansCache 缓存实现懒加载。
 */
import { computed, onMounted, watch } from 'vue'
import { safeDb as db } from '@/services/safeDb'
import { getIsoDay, getIsoMonth } from '@/utils/dateParts'
import {
  plans,
  monthlyMainGoals,
  dailyTasks,
  selectedGoal,
  editingGoal,
  showAddModal,
  initialized,
  monthlyPlansCache,
  dailyPlansCache,
  syncMonthlyPlansToFlatList
} from '@/views/direction/composables/useDirectionState'

let setupDone = false

export function useDirectionFetch() {
  const getGoalRangeFromCache = (planId) => {
    const monthlyPlans = monthlyPlansCache[planId] || []
    if (monthlyPlans.length === 0) return null

    const months = monthlyPlans
      .map(mp => getIsoMonth(mp.month))
      .filter(month => month !== null)

    if (months.length === 0) return null

    return {
      startMonth: Math.min(...months),
      endMonth: Math.max(...months)
    }
  }

  const enrichGoalWithRange = (goal) => {
    if (!goal) return goal

    const range = getGoalRangeFromCache(goal.plan_id)
    if (!range) {
      return goal
    }

    return {
      ...goal,
      ...range
    }
  }

  const categorizedGoals = computed(() => {
    const map = new Map()
    for (const plan of plans.value) {
      const categoryName = plan.plans_category?.name || '未分类'
      if (!map.has(categoryName)) map.set(categoryName, [])

      map.get(categoryName).push({
        ...enrichGoalWithRange(plan),
        name: plan.title,
        plan_id: plan.id,
        category_name: categoryName
      })
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
  })

  const loadPlans = async () => {
    plans.value = await db.plans.list()
  }

  const applyMonthlyPlansCache = (planId) => {
    syncMonthlyPlansToFlatList(planId)

    const range = getGoalRangeFromCache(planId)
    if (range) {
      plans.value = plans.value.map(plan =>
        plan.id === planId ? { ...plan, ...range } : plan
      )

      if (selectedGoal.value?.plan_id === planId) {
        selectedGoal.value = {
          ...selectedGoal.value,
          ...range
        }
      }
    }

    for (const mp of monthlyPlansCache[planId] || []) {
      if (!mp.month || !mp.plan_id) continue
      const month = getIsoMonth(mp.month)
      if (!month) continue
      monthlyMainGoals[`plan-${mp.plan_id}-${month}`] = mp
    }
  }

  const loadMonthlyPlans = async (planId) => {
    if (!monthlyPlansCache[planId]) {
      monthlyPlansCache[planId] = await db.monthlyPlans.list(planId)
    }

    applyMonthlyPlansCache(planId)
  }

  const loadDailyPlans = async (monthlyPlanId, { force = false } = {}) => {
    if (!force && dailyPlansCache[monthlyPlanId]) return

    const dps = await db.dailyPlans.list(monthlyPlanId)
    dailyPlansCache[monthlyPlanId] = dps

    const mp = Object.values(monthlyPlansCache)
      .flat()
      .find(item => item.id === monthlyPlanId)
    if (!mp) return

    const month = getIsoMonth(mp.month)
    if (!month) return
    const prefix = `plan-${mp.plan_id}-${month}-`
    for (const key of Object.keys(dailyTasks)) {
      if (key.startsWith(prefix)) delete dailyTasks[key]
    }

    for (const dp of dps) {
      const day = getIsoDay(dp.day)
      if (!day) continue
      dailyTasks[`plan-${mp.plan_id}-${month}-${day}`] = dp
    }
  }

  const fetchData = async () => {
    try {
      await loadPlans()

      if (selectedGoal.value) {
        const currentId = selectedGoal.value.plan_id
        let found = null
        for (const cat of categorizedGoals.value) {
          found = cat.items.find(item => item.plan_id === currentId)
          if (found) break
        }
        selectedGoal.value = found || categorizedGoals.value[0]?.items?.[0] || null
      } else if (categorizedGoals.value.length > 0 && categorizedGoals.value[0].items.length > 0) {
        selectedGoal.value = categorizedGoals.value[0].items[0]
      }

      if (selectedGoal.value) {
        await loadMonthlyPlans(selectedGoal.value.plan_id)
        selectedGoal.value = enrichGoalWithRange(selectedGoal.value)
      }
    } catch (e) {
      console.error('Failed to fetch direction data', e)
    }
  }

  if (!setupDone) {
    watch(showAddModal, (val) => {
      if (!val) {
        setTimeout(() => { editingGoal.value = null }, 300)
      }
    })

    onMounted(() => {
      if (!initialized.value) {
        fetchData()
        initialized.value = true
      }
    })

    setupDone = true
  }

  return {
    categorizedGoals,
    fetchData,
    loadPlans,
    loadMonthlyPlans,
    loadDailyPlans
  }
}
