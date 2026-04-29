import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DayExecutionItem, HabitLogRecord } from '@/domain/day/types'
import { toDateKey } from '@/domain/day/time'
import { toggleDailyPlanComplete } from '@/services/supabase/dailyPlans'
import { createHabitLog, deleteHabitLog, listHabitLogsForDate } from '@/services/supabase/habits'
import { toggleTaskComplete } from '@/services/supabase/tasks'

export function useExecutionItemToggle(date: Date) {
  const queryClient = useQueryClient()
  const dateKey = toDateKey(date)

  const mutation = useMutation({
    mutationFn: async (item: DayExecutionItem) => {
      const nextCompleted = !item.completed

      if (item.source === 'task') {
        await toggleTaskComplete(item.id, nextCompleted)
        return
      }

      if (item.source === 'daily_plan') {
        await toggleDailyPlanComplete(item.id, nextCompleted)
        return
      }

      const logs = await listHabitLogsForDate(date)
      const existingLog = logs.find((log) => log.habitId === item.id)

      if (nextCompleted) {
        await createHabitLog(item.id, date)
      } else if (existingLog) {
        await deleteHabitLog(existingLog.id)
      }
    },
    onMutate: async (item) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['day-tasks', dateKey] }),
        queryClient.cancelQueries({ queryKey: ['day-daily-plans', dateKey] }),
        queryClient.cancelQueries({ queryKey: ['day-habit-logs', dateKey] })
      ])

      const previousHabitLogs = queryClient.getQueryData<HabitLogRecord[]>(['day-habit-logs', dateKey])

      return { previousHabitLogs }
    },
    onError: (_error, _item, context) => {
      if (context?.previousHabitLogs) {
        queryClient.setQueryData(['day-habit-logs', dateKey], context.previousHabitLogs)
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['day-tasks', dateKey] }),
        queryClient.invalidateQueries({ queryKey: ['day-daily-plans', dateKey] }),
        queryClient.invalidateQueries({ queryKey: ['day-habit-logs', dateKey] })
      ])
    }
  })

  return {
    toggleItem: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error
  }
}
