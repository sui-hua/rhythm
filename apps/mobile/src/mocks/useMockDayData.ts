import { useMemo } from 'react'
import type { DayExecutionItem } from '@/domain/day/types'
import type { TaskFormInput } from '@/domain/tasks/types'
import { selectDayItems, toDateKey } from './data'
import { useMockStore } from './store'

// 以下三个 hook 与真实数据 hooks 签名一致，DayScreen 仅需替换 import 即可切换到假数据

// 某天的执行条目（时间轴 + 收集箱），形状对齐 useDayExecutionItems
export function useMockDayExecutionItems(currentDate: Date) {
  const dateKey = toDateKey(currentDate)
  const tasks = useMockStore((state) => state.tasks)
  const plans = useMockStore((state) => state.plans)
  const habits = useMockStore((state) => state.habits)
  const habitLogs = useMockStore((state) => state.habitLogs)
  const taskOverrides = useMockStore((state) => state.taskOverrides)
  const planOverrides = useMockStore((state) => state.planOverrides)

  return useMemo(() => {
    const { scheduledItems, unscheduledItems } = selectDayItems(dateKey, tasks, plans, habits, habitLogs, {
      ...taskOverrides,
      ...planOverrides
    })
    return { scheduledItems, unscheduledItems, isLoading: false, errors: [] as string[], refetchAll: () => {} }
  }, [dateKey, tasks, plans, habits, habitLogs, taskOverrides, planOverrides])
}

// 完成切换：按条目来源分发到对应 store action
export function useMockExecutionItemToggle(currentDate: Date) {
  const dateKey = toDateKey(currentDate)
  const toggleTask = useMockStore((state) => state.toggleTask)
  const togglePlan = useMockStore((state) => state.togglePlan)
  const toggleHabitCheckin = useMockStore((state) => state.toggleHabitCheckin)

  function toggleItem(item: DayExecutionItem) {
    if (item.source === 'task') toggleTask(dateKey, item.id)
    else if (item.source === 'daily_plan') togglePlan(dateKey, item.id)
    else toggleHabitCheckin(item.id, dateKey)
  }

  return { toggleItem, isPending: false as const }
}

// 任务增删改：写入 mock store
export function useMockTaskMutations(currentDate: Date) {
  const dateKey = toDateKey(currentDate)
  const saveTask = useMockStore((state) => state.saveTask)
  const deleteTaskFromStore = useMockStore((state) => state.deleteTask)

  async function createTask(input: TaskFormInput) {
    saveTask(input, null, dateKey)
  }

  async function updateTask({ taskId, input }: { taskId: string; input: TaskFormInput }) {
    saveTask(input, taskId, dateKey)
  }

  async function deleteTask(taskId: string) {
    deleteTaskFromStore(taskId)
  }

  return { createTask, updateTask, deleteTask, isSaving: false as const }
}
