import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useSummarySidebar } from '@/views/summary/composables/useSummarySidebar'
import { buildDefaultPeriod } from '@/views/summary/utils/summaryPeriods'

describe('useSummarySidebar', () => {
  it('uses daily summary content as the title', () => {
    const { getSummaryTitle } = useSummarySidebar(ref('day'))

    expect(
      getSummaryTitle({
        kind: 'daily',
        title: null,
        content: { done: '今天完成了 schema 对齐' }
      })
    ).toBe('今天完成了 schema 对齐')
  })

  it('prefers title for monthly summaries', () => {
    const { getSummaryTitle } = useSummarySidebar(ref('month'))

    expect(
      getSummaryTitle({
        title: '四月复盘',
        content: { text: '备用摘要' }
      })
    ).toBe('四月复盘')
  })

  it('formats dates from summary period fields', () => {
    const { formatDate } = useSummarySidebar(ref('week'))
    const period = buildDefaultPeriod('weekly', new Date(2026, 3, 18))

    expect(
      formatDate({
        kind: 'weekly',
        period_start: period.periodStart,
        period_end: period.periodEnd
      })
    ).toBe('4月13日 - 4月19日')
  })
})
