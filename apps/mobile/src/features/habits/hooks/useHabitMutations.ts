import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toDateKey } from '@/domain/day/time'
import {
  createHabit,
  createHabitLog,
  deleteHabitLog,
  listHabitLogsForDate,
  updateHabit,
  type HabitInput
} from '@/services/api/habits'

/**
 * 习惯写操作。
 *
 * 打卡沿用与 Day 页一致的语义：同一天只保留一条记录，
 * 取消打卡时先查当天记录再删（后端没有按天取消的接口）。
 */
export function useHabitMutations() {
  const queryClient = useQueryClient()

  function invalidateAll(date?: Date) {
    void queryClient.invalidateQueries({ queryKey: ['habits'] })
    void queryClient.invalidateQueries({ queryKey: ['habit-logs'] })

    if (date) {
      void queryClient.invalidateQueries({ queryKey: ['day-habit-logs', toDateKey(date)] })
    }
  }

  const createMutation = useMutation({
    mutationFn: (input: HabitInput) => createHabit(input),
    onSuccess: () => invalidateAll()
  })

  const updateMutation = useMutation({
    mutationFn: ({ habitId, input }: { habitId: string; input: Partial<HabitInput> }) =>
      updateHabit(habitId, input),
    onSuccess: () => invalidateAll()
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, date, checked }: { habitId: string; date: Date; checked: boolean }) => {
      if (checked) {
        await createHabitLog(habitId, date)
        return
      }

      const logs = await listHabitLogsForDate(date)
      const existing = logs.find((log) => log.habitId === habitId)
      if (existing) await deleteHabitLog(existing.id)
    },
    onSuccess: (_data, variables) => invalidateAll(variables.date)
  })

  return {
    createHabit: createMutation.mutateAsync,
    updateHabit: updateMutation.mutateAsync,
    toggleHabit: toggleMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || toggleMutation.isPending
  }
}
