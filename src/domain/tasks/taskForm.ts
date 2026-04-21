import type { TaskFormInput } from './types'

export function validateTaskForm(input: TaskFormInput) {
  if (!input.title.trim()) {
    throw new Error('标题不能为空')
  }

  if (input.startAt && input.endAt && new Date(input.endAt) <= new Date(input.startAt)) {
    throw new Error('结束时间必须晚于开始时间')
  }

  return {
    title: input.title.trim(),
    startAt: input.startAt,
    endAt: input.endAt,
    notes: input.notes.trim(),
    completed: Boolean(input.completed)
  }
}
