import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { getDateOnlyMonth, parseDateOnly } from '@/views/direction/utils/dateOnly'
import { useDirectionStore } from '@/stores/directionStore'
import { storeToRefs } from 'pinia'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

export function useDirectionBatch() {
  const authStore = useAuthStore()
  const store = useDirectionStore()
  const { selectedGoal, selectedMonth, batchInput, archiveVersion } = storeToRefs(store)
  const { hasTask } = useDirectionSelection()
  const { loadGoalDays } = useDirectionFetch()

  const getCurrentMonthlyPlan = (goalId, month) => {
    const cachedGoalMonths = store.goalMonthsCache[goalId] || []
    return cachedGoalMonths.find(mp => getDateOnlyMonth(mp.month) === month) || null
  }

  const resolveDailyTiming = (monthlyPlan, goal) => ({
    task_time: monthlyPlan?.task_time ?? goal?.task_time ?? '09:00',
    duration: monthlyPlan?.duration ?? goal?.duration ?? 30
  })

  const getExistingDailyPlanMap = async (monthPlanId) => {
    if (!store.goalDaysCache[monthPlanId]) {
      await loadGoalDays(monthPlanId, { force: true })
    }

    const existingDailyPlans = store.goalDaysCache[monthPlanId] || []
    const planMap = new Map()

    for (const plan of existingDailyPlans) {
      const dayDate = parseDateOnly(plan.day)
      if (!dayDate) continue

      planMap.set(dayDate.getDate(), plan)
    }

    return planMap
  }

  const applyBatchTask = async () => {
    const m = selectedMonth.value
    if (!m || !batchInput.value.trim()) return

    const currentMp = getCurrentMonthlyPlan(selectedGoal.value.goal_id, m)
    if (!currentMp) return

    const monthDate = parseDateOnly(currentMp.month)
    if (!monthDate) return

    const year = monthDate.getFullYear()
    const currentTiming = resolveDailyTiming(currentMp, selectedGoal.value)

    const currentSelectedDates = store.selectedDates[m] || []
    let daysToUpdate = currentSelectedDates.filter(day => hasTask(m, day))
    if (daysToUpdate.length === 0) {
      daysToUpdate = [...currentSelectedDates]
    }

    const existingDailyPlanMap = await getExistingDailyPlanMap(currentMp.id)

    for (const day of daysToUpdate) {
      const existingDailyPlan = existingDailyPlanMap.get(day)
      const payload = {
        goal_month_id: currentMp.id,
        user_id: authStore.userId,
        day: `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        title: batchInput.value,
        task_time: currentTiming.task_time,
        duration: currentTiming.duration
      }

      if (existingDailyPlan) {
        await db.goalDays.update(existingDailyPlan.id, {
          title: payload.title,
          task_time: payload.task_time,
          duration: payload.duration
        })
      } else {
        await db.goalDays.create(payload)
      }
    }

    await loadGoalDays(currentMp.id, { force: true })
    archiveVersion.value++
    batchInput.value = ''
    store.selectedDates[m] = []
  }

  const handleBatchDelete = async () => {
    const m = selectedMonth.value
    const currentSelectedDates = store.selectedDates[m] || []
    if (!m || currentSelectedDates.length === 0) return

    const currentMp = getCurrentMonthlyPlan(selectedGoal.value.goal_id, m)
    if (!currentMp) return

    const existingDailyPlanMap = await getExistingDailyPlanMap(currentMp.id)

    const idsToDelete = []
    for (const day of currentSelectedDates) {
      const existingDailyPlan = existingDailyPlanMap.get(day)
      if (existingDailyPlan) {
        idsToDelete.push(existingDailyPlan.id)
      }
    }

    if (idsToDelete.length > 0) {
      await db.goalDays.deleteByIds(idsToDelete)
    }

    await loadGoalDays(currentMp.id, { force: true })
    archiveVersion.value++
    store.selectedDates[m] = []
    batchInput.value = ''
  }

  return {
    batchInput,
    applyBatchTask,
    handleBatchDelete
  }
}
