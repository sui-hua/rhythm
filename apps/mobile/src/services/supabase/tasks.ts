import type { TaskFormInput, TaskRecord } from '@/domain/tasks/types'
import { validateTaskForm } from '@/domain/tasks/taskForm'
import { supabase } from './client'

function mapRow(row: any): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_time,
    endAt: row.end_time,
    notes: row.description ?? '',
    completed: Boolean(row.completed)
  }
}

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

export async function listTasksForDate(date: Date): Promise<TaskRecord[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('tasks')
    .select('id,title,start_time,end_time,description,completed')
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error

  return (data ?? []).map(mapRow)
}

export async function createTask(input: TaskFormInput) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(toPayload(input))
    .select('id,title,start_time,end_time,description,completed')
    .single()

  if (error) throw error

  return mapRow(data)
}

export async function updateTask(taskId: string, input: Partial<TaskFormInput>) {
  const payload: Record<string, unknown> = {}

  if (input.title !== undefined) payload.title = input.title.trim()
  if (input.startAt !== undefined) payload.start_time = input.startAt
  if (input.endAt !== undefined) payload.end_time = input.endAt
  if (input.notes !== undefined) payload.description = input.notes.trim()
  if (input.completed !== undefined) payload.completed = input.completed

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select('id,title,start_time,end_time,description,completed')
    .single()

  if (error) throw error

  return mapRow(data)
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  return updateTask(taskId, { completed })
}
