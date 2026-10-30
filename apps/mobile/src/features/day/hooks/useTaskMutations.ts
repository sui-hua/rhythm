import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TaskFormInput } from '@/domain/tasks/types'
import { toDateKey } from '@/domain/day/time'
import { createTask, deleteTask, toggleTaskComplete, updateTask } from '@/services/api/tasks'

export function useTaskMutations(date: Date) {
  const queryClient = useQueryClient()
  const dateKey = toDateKey(date)

  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: ['day-tasks', dateKey] })

  const createMutation = useMutation({
    mutationFn: (input: TaskFormInput) => createTask(input),
    onSuccess: invalidateTasks
  })

  const updateMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: Partial<TaskFormInput> }) => updateTask(taskId, input),
    onSuccess: invalidateTasks
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: invalidateTasks
  })

  const toggleMutation = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) => toggleTaskComplete(taskId, completed),
    onSuccess: invalidateTasks
  })

  return {
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    toggleTask: toggleMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || toggleMutation.isPending
  }
}