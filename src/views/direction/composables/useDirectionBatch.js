import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import {
  monthlyPlans,
  selectedGoal,
  selectedMonth,
  selectedDates,
  batchInput,
  dailyTasks
} from '@/views/direction/composables/useDirectionState'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'

export function useDirectionBatch() {
  const authStore = useAuthStore()
  const { dayTaskKey } = useDirectionSelection()

  const applyBatchTask = async () => {
    const m = selectedMonth.value
    if (!m || !batchInput.value.trim()) return

    const content = batchInput.value
    const currentMp = monthlyPlans.value.find(
      mp => mp.plan_id === selectedGoal.value.plan_id && new Date(mp.month).getMonth() + 1 === m
    )

    if (!currentMp) {
      console.error('Monthly plan not found for batch apply')
      return
    }

    for (const day of selectedDates[m]) {
      const key = dayTaskKey(day)
      try {
        if (dailyTasks[key] && dailyTasks[key].id) {
          await db.dailyPlans.update(dailyTasks[key].id, { title: content })
          dailyTasks[key].title = content
        } else {
          const year = new Date(currentMp.month).getFullYear()
          const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`

          const newDp = await db.dailyPlans.create({
            monthly_plan_id: currentMp.id,
            user_id: authStore.userId,
            date: dateStr,
            title: content,
            task_time: null,
            duration: null
          })
          dailyTasks[key] = newDp
        }
      } catch (e) {
        console.error(`Failed to save task for day ${day}`, e)
      }
    }
    batchInput.value = ''
    selectedDates[m] = []
  }

  const handleBatchDelete = async () => {
    const m = selectedMonth.value
    if (!m || !selectedDates[m] || selectedDates[m].length === 0) return

    for (const day of selectedDates[m]) {
      const key = dayTaskKey(day)
      try {
        if (dailyTasks[key] && dailyTasks[key].id) {
          await db.dailyPlans.delete(dailyTasks[key].id)
          delete dailyTasks[key]
        }
      } catch (e) {
        console.error(`Failed to delete task for day ${day}`, e)
      }
    }
    selectedDates[m] = []
    batchInput.value = ''
  }

  return {
    batchInput,
    applyBatchTask,
    handleBatchDelete
  }
}
