import type { TaskFormInput, TaskRecord } from '@/domain/tasks/types'
import { validateTaskForm } from '@/domain/tasks/taskForm'
import { toDateKey } from '@/domain/day/time'
import { apiRequest } from './client'

/** 后端 task 行（snake_case，时间字段为 ISO 字符串） */
type TaskRow = {
  id: string
  title: string
  description: string | null
  start_time: string | null
  end_time: string | null
  completed: boolean | null
}

function mapRow(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_time,
    endAt: row.end_time,
    notes: row.description ?? '',
    completed: Boolean(row.completed)
  }
}

/** 表单 → 后端字段。字段名与原有 Supabase 写入完全一致，避免语义漂移 */
function toPayload(input: TaskFormInput) {
  const validated = validateTaskForm(input)

  return {
    title: validated.title,
    start_time: validated.startAt,
    end_time: validated.endAt,
    description: validated.notes,
    completed: validated.completed
  }
}

/** 当天任务：后端按 start_time 区间过滤，与 web 端 task.list 一致 */
export async function listTasksForDate(date: Date): Promise<TaskRecord[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const rows = await apiRequest<TaskRow[]>('/tasks', {
    query: { start: start.toISOString(), end: end.toISOString() }
  })

  return rows.map(mapRow)
}

/** 收集箱：无时间且未完成 */
export async function listInboxTasks(): Promise<TaskRecord[]> {
  const rows = await apiRequest<TaskRow[]>('/tasks/inbox')
  return rows.map(mapRow)
}

export async function createTask(input: TaskFormInput): Promise<TaskRecord> {
  const row = await apiRequest<TaskRow>('/tasks', { method: 'POST', body: toPayload(input) })
  return mapRow(row)
}

export async function updateTask(taskId: string, input: Partial<TaskFormInput>): Promise<TaskRecord> {
  const payload: Record<string, unknown> = {}

  if (input.title !== undefined) payload.title = input.title.trim()
  if (input.startAt !== undefined) payload.start_time = input.startAt
  if (input.endAt !== undefined) payload.end_time = input.endAt
  if (input.notes !== undefined) payload.description = input.notes.trim()
  if (input.completed !== undefined) payload.completed = input.completed

  const row = await apiRequest<TaskRow>(`/tasks/${taskId}`, { method: 'PATCH', body: payload })
  return mapRow(row)
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/tasks/${taskId}`, { method: 'DELETE' })
}

export async function toggleTaskComplete(taskId: string, completed: boolean): Promise<TaskRecord> {
  return updateTask(taskId, { completed })
}

/** 仅用于调试日志的可读日期，不参与请求 */
export function debugDateLabel(date: Date) {
  return toDateKey(date)
}
