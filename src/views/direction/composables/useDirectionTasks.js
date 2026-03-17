import { db } from '@/services/database'
import { dailyTasks } from '@/views/direction/composables/useDirectionState'

export function useDirectionTasks() {
  const handleUpdateTask = async (task) => {
    if (!task || !task.id) return
    try {
      const payload = {
        title: task.title,
        task_time: task.task_time,
        duration: task.duration
      }
      await db.dailyPlans.update(task.id, payload)

      for (const [k, v] of Object.entries(dailyTasks)) {
        if (v.id === task.id) {
          dailyTasks[k] = { ...v, ...payload }
          break
        }
      }
    } catch (e) {
      console.error('Failed to update task', e)
    }
  }

  return {
    handleUpdateTask
  }
}
