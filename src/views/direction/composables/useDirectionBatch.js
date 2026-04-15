/**
 * 方向模块批量操作 (useDirectionBatch.js)
 * 通过 RPC 实现选中日期的批量新增、修改、删除，提高日程录入效率。
 */
import { useAuthStore } from '@/stores/authStore'
import { safeDb as db } from '@/services/safeDb'
import {
  monthlyPlansCache,
  selectedGoal,
  selectedMonth,
  selectedDates,
  batchInput,
  dailyTasks,
  archiveVersion
} from '@/views/direction/composables/useDirectionState'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { getIsoMonth, getIsoYear } from '@/utils/dateParts'

export function useDirectionBatch() {
  const authStore = useAuthStore()
  const { hasTask, dayTaskKey } = useDirectionSelection()
  const { loadDailyPlans } = useDirectionFetch()

  const applyBatchTask = async () => {
    const m = selectedMonth.value
    if (!m || !batchInput.value.trim()) return

    const cachedPlans = monthlyPlansCache[selectedGoal.value.plan_id] || []
    const currentMp = cachedPlans.find(mp => getIsoMonth(mp.month) === m)
    if (!currentMp) return

    const year = getIsoYear(currentMp.month)
    if (!year) return
    let daysToUpdate = selectedDates[m].filter(day => hasTask(m, day))
    if (daysToUpdate.length === 0) {
      daysToUpdate = [...selectedDates[m]]
    }

    const items = daysToUpdate.map(day => ({
      date: `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      title: batchInput.value,
      task_time: null,
      duration: null
    }))

    await db.rpc('batch_upsert_daily_plans', {
      p_monthly_plan_id: currentMp.id,
      p_user_id: authStore.userId,
      p_items: items
    })

    await loadDailyPlans(currentMp.id, { force: true })
    archiveVersion.value++
    batchInput.value = ''
    selectedDates[m] = []
  }

  const handleBatchDelete = async () => {
    const m = selectedMonth.value
    if (!m || !selectedDates[m] || selectedDates[m].length === 0) return

    const cachedPlans = monthlyPlansCache[selectedGoal.value.plan_id] || []
    const currentMp = cachedPlans.find(mp => getIsoMonth(mp.month) === m)
    if (!currentMp) return

    await db.rpc('batch_delete_daily_plans', {
      p_monthly_plan_id: currentMp.id,
      p_days: selectedDates[m]
    })

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
