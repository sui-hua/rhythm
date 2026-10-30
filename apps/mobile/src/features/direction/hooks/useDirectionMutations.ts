import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGoal, deleteGoal, toggleGoalDay, updateGoal, type GoalInput } from '@/services/api/goals'

/** 方向页写操作：目标增删改 + 日目标勾选 */
export function useDirectionMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['goals'] })
  }

  const createMutation = useMutation({
    mutationFn: (input: GoalInput) => createGoal(input),
    onSuccess: invalidate
  })

  const updateMutation = useMutation({
    mutationFn: ({ goalId, input }: { goalId: string; input: Partial<GoalInput> }) => updateGoal(goalId, input),
    onSuccess: invalidate
  })

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId),
    onSuccess: invalidate
  })

  const toggleDayMutation = useMutation({
    mutationFn: ({ goalDayId, completed }: { goalDayId: string; completed: boolean }) =>
      toggleGoalDay(goalDayId, completed),
    onSuccess: invalidate
  })

  return {
    createGoal: createMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync,
    toggleGoalDay: toggleDayMutation.mutateAsync,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      toggleDayMutation.isPending
  }
}
