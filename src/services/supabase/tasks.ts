import type { TaskFormInput, TaskRecord } from '@/domain/tasks/types'
import { supabase } from './client'

function mapRow(row: any): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_time,
    endAt: row.end_time,
    notes: row.description ?? '',
    completed: row.completed
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

  if (error) {
    throw error
  }

  return (data ?? []).map(mapRow)
}

export async function createTask(_input: TaskFormInput) {}

export async function updateTask(_taskId: string, _input: Partial<TaskFormInput>) {}

export async function deleteTask(_taskId: string) {}

export async function toggleTaskComplete(_taskId: string, _completed: boolean) {}
