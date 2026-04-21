import { useQuery } from '@tanstack/react-query'
import { groupTasksForDay } from '@/domain/tasks/taskGroups'
import { listTasksForDate } from '@/services/supabase/tasks'

export function useDayTasks(date: Date) {
  const query = useQuery({
    queryKey: ['day-tasks', date.toISOString().slice(0, 10)],
    queryFn: () => listTasksForDate(date)
  })

  return {
    ...query,
    groups: groupTasksForDay(query.data ?? [])
  }
}
