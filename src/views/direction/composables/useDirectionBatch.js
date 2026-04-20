/**
 * ============================================
 * Direction 批量操作层 (views/direction/composables/useDirectionBatch.js)
 * ============================================
 *
 * 【模块职责】
 * - 处理日计划的批量创建、批量删除
 * - 通过本地数据库实现批量操作（替代 RPC 实现）
 *
 * 【批量操作流程】
 * 1. applyBatchTask() → 批量添加/更新日计划
 * 2. handleBatchDelete() → 批量删除日计划
 *
 * 【依赖模块】
 * - useDirectionState → 状态管理（月度计划缓存、日计划缓存、选中目标等）
 * - useDirectionSelection → 选择状态管理（日期选中、任务存在性判断）
 * - useDirectionFetch → 数据获取（加载日计划）
 *
 * @module direction/composables/useDirectionBatch
 * @author [项目组]
 * @since [版本日期]
 */
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { getDateOnlyMonth, parseDateOnly } from '@/views/direction/utils/dateOnly'
import { useDirectionState } from '@/views/direction/composables/useDirectionState'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

export function useDirectionBatch() {
  const authStore = useAuthStore()
  const { hasTask } = useDirectionSelection()
  const { loadDailyPlans } = useDirectionFetch()

  const {
    monthlyPlansCache,
    dailyPlansCache,
    selectedGoal,
    selectedMonth,
    selectedDates,
    batchInput,
    archiveVersion
  } = useDirectionState()

  /**
   * 获取当前月份对应的月度计划
   * @param {string|number} planId - 长期目标ID
   * @param {string|number} month - 月份标识（如 3 或 "03"）
   * @returns {Object|null} 月度计划对象，若未找到则返回 null
   */
  const getCurrentMonthlyPlan = (planId, month) => {
    const cachedPlans = monthlyPlansCache[planId] || []
    return cachedPlans.find(mp => getDateOnlyMonth(mp.month) === month) || null
  }

  /**
   * 获取指定月度计划下的日计划 Map（key: 日期中的 day 部分，value: 日计划对象）
   * 优先从缓存获取，缓存不存在则强制刷新加载
   * @param {string|number} monthlyPlanId - 月度计划ID
   * @returns {Promise<Map<number, Object>>} 日计划 Map，key 为日期（1-31）
   */
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

  /**
   * 批量添加/更新日计划任务
   * - 获取当前选中的月度计划
   * - 遍历选中的日期，对已有日计划的日期执行更新，对无日计划的日期执行创建
   * - 完成后刷新缓存、递增归档版本、清空批量输入和选中日期
   * @returns {Promise<void>}
   */
  const applyBatchTask = async () => {
    const m = selectedMonth.value
    if (!m || !batchInput.value.trim()) return

    const currentMp = getCurrentMonthlyPlan(selectedGoal.value.plan_id, m)
    if (!currentMp) return

    const monthDate = parseDateOnly(currentMp.month)
    if (!monthDate) return

    const year = monthDate.getFullYear()

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
        task_time: null,
        duration: null
      }

      if (existingDailyPlan) {
        await db.dailyPlans.update(existingDailyPlan.id, {
          title: payload.title,
          task_time: payload.task_time,
          duration: payload.duration
        })
      } else {
        await db.dailyPlans.create(payload)
      }
    }

    await loadDailyPlans(currentMp.id, { force: true })
    archiveVersion.value++
    batchInput.value = ''
    selectedDates[m] = []
  }

  /**
   * 批量删除日计划任务
   * - 遍历当前选中的日期，删除已存在的日计划
   * - 完成后刷新缓存、递增归档版本、清空批量输入和选中日期
   * @returns {Promise<void>}
   */
  const handleBatchDelete = async () => {
    const m = selectedMonth.value
    const currentSelectedDates = selectedDates[m] || []
    if (!m || currentSelectedDates.length === 0) return

    const currentMp = getCurrentMonthlyPlan(selectedGoal.value.plan_id, m)
    if (!currentMp) return

    const existingDailyPlanMap = await getExistingDailyPlanMap(currentMp.id)

    for (const day of currentSelectedDates) {
      const existingDailyPlan = existingDailyPlanMap.get(day)
      if (existingDailyPlan) {
        await db.dailyPlans.delete(existingDailyPlan.id)
      }
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
