import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSummary, updateSummary, type SummaryInput } from '@/services/api/summaries'

/** 总结写操作：有 id 走更新，没有则新建 */
export function useSummaryMutations() {
  const queryClient = useQueryClient()

  const invalidate = (kind: SummaryInput['kind']) => {
    void queryClient.invalidateQueries({ queryKey: ['summaries', kind] })
    void queryClient.invalidateQueries({ queryKey: ['summaries', 'by-date'] })
  }

  const saveMutation = useMutation({
    mutationFn: ({ summaryId, input }: { summaryId: string | null; input: SummaryInput }) =>
      summaryId ? updateSummary(summaryId, input) : createSummary(input),
    onSuccess: (_data, variables) => invalidate(variables.input.kind)
  })

  return {
    saveSummary: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    error: saveMutation.error
  }
}
