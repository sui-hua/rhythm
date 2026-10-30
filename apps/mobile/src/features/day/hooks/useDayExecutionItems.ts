import { useQuery } from '@tanstack/react-query'
import { buildDayExecutionItems, splitExecutionItems } from '@/domain/day/buildDayExecutionItems'
import { toDateKey } from '@/domain/day/time'
import { listDailyPlansForDate } from '@/services/api/dailyPlans'
import { listHabitLogsForDate, listHabits } from '@/services/api/habits'
import { listTasksForDate } from '@/services/api/tasks'

export function useDayExecutionItems(date: Date) {
  const dateKey = toDateKey(date)

  const tasksQuery = useQuery({
    queryKey: ['day-tasks', dateKey],
    queryFn: () => listTasksForDate(date),
    retry: false
  })

  const dailyPlansQuery = useQuery({
    queryKey: ['day-daily-plans', dateKey],
    queryFn: () => listDailyPlansForDate(date),
    retry: false
  })

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: () => listHabits(),
    retry: false
  })

  const habitLogsQuery = useQuery({
    queryKey: ['day-habit-logs', dateKey],
    queryFn: () => listHabitLogsForDate(date),
    retry: false
  })

  const items = buildDayExecutionItems({
    tasks: tasksQuery.data ?? [],
    dailyPlans: dailyPlansQuery.data ?? [],
    habits: habitsQuery.data ?? [],
    habitLogs: habitLogsQuery.data ?? []
  })

  const { scheduledItems, unscheduledItems } = splitExecutionItems(items)

  return {
    scheduledItems,
    unscheduledItems,
    isLoading: tasksQuery.isLoading || dailyPlansQuery.isLoading || habitsQuery.isLoading || habitLogsQuery.isLoading,
    errors: [tasksQuery.error, dailyPlansQuery.error, habitsQuery.error, habitLogsQuery.error].filter(Boolean),
    refetchAll: () => {
      void tasksQuery.refetch()
      void dailyPlansQuery.refetch()
      void habitsQuery.refetch()
      void habitLogsQuery.refetch()
    }
  }
}