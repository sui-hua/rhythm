/**
 * ============================================
 * Direction 批量操作层 (views/direction/composables/useDirectionBatch.js)
 * ============================================
 *
 * 【模块职责】
 * - 处理日计划的批量创建、批量删除
 * - 通过 RPC 实现高性能批量操作
 *
 * 【RPC 调用】
 * - batch_upsert_daily_plans → 批量新增/更新每日任务
 * - batch_delete_daily_plans → 批量删除指定日期的任务
 *
 * 【批量操作流程】
 * 1. applyBatchTask() → 批量添加/更新日计划
 * 2. handleBatchDelete() → 批量删除日计划
 */
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { getDateOnlyMonth, parseDateOnly } from '@/views/direction/utils/dateOnly'
import {
  monthlyPlansCache,
  dailyPlansCache,
  selectedGoal,
  selectedMonth,
  selectedDates,
  batchInput,
  archiveVersion
} from '@/views/direction/composables/useDirectionState'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

export function useDirectionBatch() {
  const authStore = useAuthStore()
  const { hasTask } = useDirectionSelection()
  const { loadDailyPlans } = useDirectionFetch()

  const getCurrentMonthlyPlan = (planId, month) => {
    const cachedPlans = monthlyPlansCache[planId] || []
    return cachedPlans.find(mp => getDateOnlyMonth(mp.month) === month) || null
  }

  const resolveDailyTiming = (monthlyPlan, goal) => ({
    task_time: monthlyPlan?.task_time ?? goal?.task_time ?? '09:00',
    duration: monthlyPlan?.duration ?? goal?.duration ?? 30
  })

  const getExistingDailyPlanMap = async (monthlyPlanId) => {
    if (!dailyPlansCache[monthlyPlanId]) {
      await loadDailyPlans(monthlyPlanId, { force: true })
    }

    const existingDailyPlans = dailyPlansCache[monthlyPlanId] || []
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

    const currentMp = getCurrentMonthlyPlan(selectedGoal.value.plan_id, m)
    if (!currentMp) return

    const monthDate = parseDateOnly(currentMp.month)
    if (!monthDate) return

    const year = monthDate.getFullYear()
    const currentTiming = resolveDailyTiming(currentMp, selectedGoal.value)

    const currentSelectedDates = selectedDates[m] || []
    let daysToUpdate = currentSelectedDates.filter(day => hasTask(m, day))
    if (daysToUpdate.length === 0) {
      daysToUpdate = [...currentSelectedDates]
    }

    const existingDailyPlanMap = await getExistingDailyPlanMap(currentMp.id)

    for (const day of daysToUpdate) {
      const existingDailyPlan = existingDailyPlanMap.get(day)
      const payload = {
        monthly_plan_id: currentMp.id,
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

    await loadDailyPlans(currentMp.id, { force: true })
    archiveVersion.value++
    batchInput.value = ''
    selectedDates[m] = []
  }

  const handleBatchDelete = async () => {
    const m = selectedMonth.value
    const currentSelectedDates = selectedDates[m] || []
    if (!m || currentSelectedDates.length === 0) return

    const currentMp = getCurrentMonthlyPlan(selectedGoal.value.plan_id, m)
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

    await loadDailyPlans(currentMp.id, { force: true })
    archiveVersion.value++
    selectedDates[m] = []
    batchInput.value = ''
  }

  return {
    batchInput,
    applyBatchTask,
    handleBatchDelete
  }
}
