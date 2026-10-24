import type { HabitFrequency, HabitLogRecord, HabitRecord } from '@/domain/day/types'
import { supabase } from './client'

function mapFrequency(value: unknown): HabitFrequency {
  if (value && typeof value === 'object' && 'type' in value) {
    return value as HabitFrequency
  }

  return { type: 'daily' }
}

function mapHabit(row: any): HabitRecord {
  return {
    id: row.id,
    title: row.title,
    targetValue: row.target_value ?? '',
    taskTime: row.task_time,
    duration: row.duration,
    frequency: mapFrequency(row.frequency),
    isArchived: Boolean(row.is_archived ?? row.archived)
  }
}

function mapLog(row: any): HabitLogRecord {
  return {
    id: row.id,
    habitId: row.habit_id,
    completedAt: row.completed_at
  }
}

export async function listHabitsForDate(_date: Date) {
  const { data, error } = await supabase
    .from('habits')
    .select('id,title,target_value,task_time,duration,frequency,archived,is_archived')
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map(mapHabit).filter((habit) => !habit.isArchived)
}

export async function listHabitLogsForDate(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('habit_logs')
    .select('id,habit_id,completed_at')
    .gte('completed_at', start.toISOString())
    .lte('completed_at', end.toISOString())

  if (error) throw error

  return (data ?? []).map(mapLog)
}

export async function createHabitLog(habitId: string, date: Date) {
  const { data, error } = await supabase
    .from('habit_logs')
    .insert({
      habit_id: habitId,
      log: '',
      completed_at: date.toISOString()
    })
    .select('id,habit_id,completed_at')
    .single()

  if (error) throw error

  return mapLog(data)
}

export async function deleteHabitLog(logId: string) {
  const { error } = await supabase.from('habit_logs').delete().eq('id', logId)
  if (error) throw error
}