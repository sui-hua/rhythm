import { db } from '@/services/database'
import { useDirectionState } from '@/views/direction/composables/useDirectionState'

export function useDirectionTasks() {
  const { dailyTasks } = useDirectionState()
  // 二元签名：handleUpdateTask(task, payload)
  const handleUpdateTask = async (task, payload) => {
    if (!task || !task.id) return
    try {
      await db.dailyPlans.update(task.id, {
        title: payload.title ?? task.title,
        task_time: payload.task_time ?? task.task_time,
        duration: payload.duration ?? task.duration
      })

      // 同步兼容层：遍历找 id 匹配项并更新
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
