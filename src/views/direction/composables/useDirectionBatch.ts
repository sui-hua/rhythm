/**
 * Direction 批量编辑 composable。
 * 提供批量创建/更新/删除日计划的能力。
 */

import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { getDateOnlyMonth, parseDateOnly } from '@/views/direction/utils/dateOnly'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { storeToRefs } from 'pinia'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import type { GoalMonth } from '@/services/db/goalMonths'
import type { GoalDay } from '@/services/db/goalDays'
import type { GoalWithMeta, DirectionBatchReturn } from '@/views/direction/types'

export function useDirectionBatch(): DirectionBatchReturn {
  const authStore = useAuthStore()
  const dataStore = useGoalDataStore()
  const selectionStore = useGoalSelectionStore()
  const batchStore = useGoalBatchStore()
  const { selectedGoal, selectedMonth } = storeToRefs(selectionStore)
  const { batchInput } = storeToRefs(batchStore)
  const { archiveVersion } = storeToRefs(dataStore)

  // 将 store 引用断言为具体类型
  const selectedGoalTyped = selectedGoal as unknown as { value: GoalWithMeta | null }
  const selectedMonthTyped = selectedMonth as unknown as { value: number | null }

  // 将 store 缓存断言为具体类型
  const goalMonthsCache = dataStore.goalMonthsCache as unknown as Record<string, GoalMonth[]>
  const goalDaysCache = dataStore.goalDaysCache as unknown as Record<string, GoalDay[]>
  const selectedDates = batchStore.selectedDates as unknown as Record<number, number[]>

  const { hasTask } = useDirectionSelection()
  const { loadGoalDays } = useDirectionFetch()

  /** 从缓存中查找指定目标和月份的月度计划 */
  const getCurrentMonthlyPlan = (goalId: string | number, month: number): GoalMonth | null => {
    const cachedGoalMonths = goalMonthsCache[String(goalId)] || []
    return cachedGoalMonths.find(mp => getDateOnlyMonth(mp.month) === month) || null
  }

  /** 解析日计划的时间配置，带 fallback 链 */
  const resolveDailyTiming = (monthlyPlan: GoalMonth | null, goal: GoalWithMeta | null): { task_time: string; duration: number } => ({
    task_time: monthlyPlan?.task_time ?? goal?.task_time ?? '09:00',
    duration: monthlyPlan?.duration ?? goal?.duration ?? 30
  })

  /** 获取已有日计划的 day→plan 映射表，必要时先加载 */
  const getExistingDailyPlanMap = async (monthPlanId: string): Promise<Map<number, GoalDay>> => {
    if (!goalDaysCache[monthPlanId]) {
      await loadGoalDays(monthPlanId, { force: true })
    }

    const existingDailyPlans = goalDaysCache[monthPlanId] || []
    const planMap = new Map<number, GoalDay>()

    for (const plan of existingDailyPlans) {
      const dayDate = parseDateOnly(plan.day)
      if (!dayDate) continue

      planMap.set(dayDate.getDate(), plan)
    }

    return planMap
  }

  /** 批量创建/更新日计划：对选中日期执行 upsert 操作 */
  const applyBatchTask = async (): Promise<void> => {
    const m = selectedMonthTyped.value
    if (!m || !batchInput.value.trim()) return

    const currentMp = getCurrentMonthlyPlan(selectedGoalTyped.value!.goal_id, m)
    if (!currentMp) return

    const monthDate = parseDateOnly(currentMp.month)
    if (!monthDate) return

    const year = monthDate.getFullYear()
    const currentTiming = resolveDailyTiming(currentMp, selectedGoalTyped.value)

    const currentSelectedDates = selectedDates[m] || []
    let daysToUpdate = currentSelectedDates.filter(day => hasTask(m, day))
    if (daysToUpdate.length === 0) {
      daysToUpdate = [...currentSelectedDates]
    }

    const existingDailyPlanMap = await getExistingDailyPlanMap(currentMp.id)

    for (const day of daysToUpdate) {
      const existingDailyPlan = existingDailyPlanMap.get(day)
      const payload = {
        goal_month_id: currentMp.id,
        user_id: authStore.userId!,
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
    selectedDates[m] = []
  }

  /** 批量删除选中日期的日计划 */
  const handleBatchDelete = async (): Promise<void> => {
    const m = selectedMonthTyped.value
    const currentSelectedDates = selectedDates[m!] || []
    if (!m || currentSelectedDates.length === 0) return

    const currentMp = getCurrentMonthlyPlan(selectedGoalTyped.value!.goal_id, m)
    if (!currentMp) return

    const existingDailyPlanMap = await getExistingDailyPlanMap(currentMp.id)

    const idsToDelete: string[] = []
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
    selectedDates[m] = []
    batchInput.value = ''
  }

  return {
    batchInput,
    applyBatchTask,
    handleBatchDelete
  }
}
