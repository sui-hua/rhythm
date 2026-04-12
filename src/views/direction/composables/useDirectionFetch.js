import { computed, onMounted, watch } from 'vue'
import { safeDb as db } from '@/services/safeDb'
import {
  plans,
  monthlyPlans,
  monthlyMainGoals,
  dailyTasks,
  selectedGoal,
  editingGoal,
  showAddModal,
  initialized
} from '@/views/direction/composables/useDirectionState'

let setupDone = false

export function useDirectionFetch() {
  const categorizedGoals = computed(() => {
    const map = new Map()
    for (const plan of plans.value) {
      const categoryName = plan.plans_category?.name || '未分类'
      if (!map.has(categoryName)) map.set(categoryName, [])

      const mps = monthlyPlans.value.filter(mp => mp.plan_id === plan.id)

      let minMonth = 1
      let maxMonth = 12

      if (mps.length > 0) {
        const months = mps
          .map(mp => (mp.month ? new Date(mp.month).getMonth() + 1 : null))
          .filter(m => m !== null)
        if (months.length > 0) {
          minMonth = Math.min(...months)
          maxMonth = Math.max(...months)
        }
      }

      map.get(categoryName).push({
        ...plan,
        name: plan.title,
        startMonth: minMonth,
        endMonth: maxMonth,
        plan_id: plan.id,
        category_name: categoryName
      })
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
  })

  const fetchData = async () => {
    try {
      plans.value = await db.plans.list()

      const allMonthlyPlans = []
      for (const plan of plans.value) {
        const mps = await db.monthlyPlans.list(plan.id)
        allMonthlyPlans.push(...mps)
      }
      monthlyPlans.value = allMonthlyPlans

      for (const mp of monthlyPlans.value) {
        if (!mp.month || !mp.plan_id) continue
        const m = new Date(mp.month).getMonth() + 1
        const key = `plan-${mp.plan_id}-${m}`
        monthlyMainGoals[key] = mp
      }

      const allDailyPlans = []
      const mpMap = new Map()
      for (const mp of monthlyPlans.value) {
        mpMap.set(mp.id, mp)
        const dps = await db.dailyPlans.list(mp.id)
        allDailyPlans.push(...dps)
      }

      for (const dp of allDailyPlans) {
        const mp = mpMap.get(dp.monthly_plan_id)
        if (mp) {
          const m = new Date(mp.month).getMonth() + 1
          const d = new Date(dp.date).getDate()
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
    fetchData
  }
}
