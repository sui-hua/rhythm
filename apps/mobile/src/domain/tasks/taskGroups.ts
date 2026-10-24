import type { TaskRecord } from './types'

export function groupTasksForDay(tasks: TaskRecord[]) {
  const scheduled = tasks
    .filter((task) => task.startAt)
    .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime())

  const unscheduled = tasks.filter((task) => !task.startAt)

  return { scheduled, unscheduled }
}
