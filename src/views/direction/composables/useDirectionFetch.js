/**
 * ============================================
 * Direction 数据获取层 (views/direction/composables/useDirectionFetch.js)
 * ============================================
 *
 * 【模块职责】
 * - 从数据库获取 plans、monthlyPlans、dailyPlans 数据
 * - 按分类整理目标列表
 * - 管理数据缓存，减少重复请求
 * - 支持按需加载（lazy load）
 *
 * 【数据流】
 * 1. fetchData() → 加载所有目标及月度计划
 * 2. loadMonthlyPlans(planId) → 按需加载某个目标的月计划
 * 3. loadDailyPlans(monthlyPlanId) → 按需加载某个月的日计划
 *
 * 【缓存机制】
 * - monthlyPlansCache → 按 planId 索引的月计划缓存
 * - dailyPlansCache → 按 monthlyPlanId 索引的日计划缓存
 */
import { computed, onMounted, watch, ref } from 'vue'
import { safeDb as db } from '@/services/safeDb'
import { parseDateOnly } from '@/views/direction/utils/dateOnly'
import {
  plans,
  monthlyPlans,
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

export { parseDateOnly } from '@/views/direction/utils/dateOnly'

export function useDirectionFetch() {
  const isPageLoading = ref(false)
  const categorizedGoals = computed(() => {
    const map = new Map()
    for (const plan of plans.value) {
      const categoryName = plan.plans_category?.name || '未分类'
      if (!map.has(categoryName)) map.set(categoryName, [])

      map.get(categoryName).push({
        ...plan,
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

  const loadMonthlyPlans = async (planId) => {
    if (monthlyPlansCache[planId]) return
    monthlyPlansCache[planId] = await db.monthlyPlans.list(planId)
    syncMonthlyPlansToFlatList(planId)
  }

  const loadDailyPlans = async (monthlyPlanId, { force = false } = {}) => {
    if (!force && dailyPlansCache[monthlyPlanId]) return

    const dps = await db.dailyPlans.list(monthlyPlanId)
    dailyPlansCache[monthlyPlanId] = dps

    const mp = Object.values(monthlyPlansCache)
      .flat()
      .find(item => item.id === monthlyPlanId)
    if (!mp) return

    const monthDate = parseDateOnly(mp.month)
    if (!monthDate) return

    const month = monthDate.getMonth() + 1
    const prefix = `plan-${mp.plan_id}-${month}-`
    for (const key of Object.keys(dailyTasks)) {
      if (key.startsWith(prefix)) delete dailyTasks[key]
    }

    for (const dp of dps) {
      const dayDate = parseDateOnly(dp.day)
      if (!dayDate) continue

      const day = dayDate.getDate()
      dailyTasks[`plan-${mp.plan_id}-${month}-${day}`] = dp
    }
  }

  const fetchData = async () => {
    isPageLoading.value = true
    try {
      plans.value = await db.plans.list()

      const monthlyPlanGroups = await Promise.all(
        plans.value.map(plan => db.monthlyPlans.list(plan.id))
      )
      monthlyPlans.value = monthlyPlanGroups.flat()

      for (const mp of monthlyPlans.value) {
        if (!mp.month || !mp.plan_id) continue
        const monthDate = parseDateOnly(mp.month)
        if (!monthDate) continue

        const m = monthDate.getMonth() + 1
        const key = `plan-${mp.plan_id}-${m}`
        monthlyMainGoals[key] = mp
      }

      const mpMap = new Map()
      for (const mp of monthlyPlans.value) {
        mpMap.set(mp.id, mp)
      }

      const dailyPlanGroups = await Promise.all(
        monthlyPlans.value.map(mp => db.dailyPlans.list(mp.id))
      )
      const allDailyPlans = dailyPlanGroups.flat()

      for (const dp of allDailyPlans) {
        const mp = mpMap.get(dp.monthly_plan_id)
        if (mp) {
          const monthDate = parseDateOnly(mp.month)
          const dayDate = parseDateOnly(dp.day)
          if (!monthDate || !dayDate) continue

          const m = monthDate.getMonth() + 1
          const d = dayDate.getDate()
          const key = `plan-${mp.plan_id}-${m}-${d}`
          dailyTasks[key] = dp
        }
      }

      if (selectedGoal.value) {
        const currentId = selectedGoal.value.plan_id
        let found = null
        for (const cat of categorizedGoals.value) {
          found = cat.items.find(item => item.plan_id === currentId)
          if (found) break
        }
        if (found) {
          selectedGoal.value = found
        } else {
          if (categorizedGoals.value.length > 0 && categorizedGoals.value[0].items.length > 0) {
            selectedGoal.value = categorizedGoals.value[0].items[0]
          } else {
            selectedGoal.value = null
          }
        }
      } else if (categorizedGoals.value.length > 0 && categorizedGoals.value[0].items.length > 0) {
        selectedGoal.value = categorizedGoals.value[0].items[0]
      }
    } catch (e) {
      console.error('Failed to fetch direction data', e)
    } finally {
      isPageLoading.value = false
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
    isPageLoading,
    loadPlans,
    loadMonthlyPlans,
    loadDailyPlans
  }
}
