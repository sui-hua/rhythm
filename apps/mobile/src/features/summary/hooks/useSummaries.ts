import { useQuery } from '@tanstack/react-query'
import { getSummaryByDate, listSummaries, type SummaryKind } from '@/services/api/summaries'

/** 某一类总结的历史列表（daily / weekly / monthly / yearly） */
export function useSummaryList(kind: SummaryKind) {
  const query = useQuery({
    queryKey: ['summaries', kind],
    queryFn: () => listSummaries(kind)
  })

  return {
    summaries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error
  }
}

/** 指定日期是否已有该类总结 */
export function useSummaryByDate(dateKey: string, kind: SummaryKind) {
  const query = useQuery({
    queryKey: ['summaries', 'by-date', kind, dateKey],
    queryFn: () => getSummaryByDate(dateKey, kind)
  })

  return {
    summary: query.data ?? null,
    isLoading: query.isLoading
  }
}
