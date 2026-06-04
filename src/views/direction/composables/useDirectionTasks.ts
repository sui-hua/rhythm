/**
 * Direction 任务编辑 composable。
 * 提供日计划任务的更新能力，同时同步到 store 中的 dailyTasks 映射。
 */

import { db } from '@/services/database'
import { useDirectionStore } from '@/stores/directionStore'
import type { GoalDay, DirectionTasksReturn } from '@/views/direction/types'

export function useDirectionTasks(): DirectionTasksReturn {
  const store = useDirectionStore()

  /**
   * 更新单个日计划任务。
   * 二元签名：先更新数据库，再同步到 store 的 dailyTasks 映射表。
   */
  const handleUpdateTask = async (task: GoalDay, payload: Partial<GoalDay>): Promise<void> => {
    if (!task || !task.id) return
    try {
      await db.goalDays.update(task.id, {
        title: payload.title ?? task.title,
        task_time: payload.task_time ?? task.task_time,
        duration: payload.duration ?? task.duration
      })

      // 同步兼容层：遍历找 id 匹配项并更新
      const tasks = store.dailyTasks as unknown as Record<string, GoalDay>
      for (const [k, v] of Object.entries(tasks)) {
        if (v.id === task.id) {
          tasks[k] = { ...v, ...payload }
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
