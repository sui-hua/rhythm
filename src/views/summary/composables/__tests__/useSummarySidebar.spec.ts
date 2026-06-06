import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useSummarySidebar } from '@/views/summary/composables/useSummarySidebar'
import type { SummaryItem } from '@/views/summary/composables/useSummarySidebar'
import { buildDefaultPeriod } from '@/services/db/summaryPeriods'

describe('useSummarySidebar', () => {
  it('uses daily summary content as the title', () => {
    const { getSummaryTitle } = useSummarySidebar(ref('day'))

    // 使用 SummaryItem 类型确保字段匹配
    const summary: SummaryItem = {
      kind: 'daily',
      title: null,
      content: { done: '今天完成了 schema 对齐' }
    }

    expect(getSummaryTitle(summary)).toBe('今天完成了 schema 对齐')
  })

  it('prefers title for monthly summaries', () => {
    const { getSummaryTitle } = useSummarySidebar(ref('month'))

    const summary: SummaryItem = {
      title: '四月复盘',
      content: { text: '备用摘要' }
    }

    expect(getSummaryTitle(summary)).toBe('四月复盘')
  })

  it('formats dates from summary period fields', () => {
    const { formatDate } = useSummarySidebar(ref('week'))
    const period = buildDefaultPeriod('weekly', new Date(2026, 3, 18))

    const summary: SummaryItem = {
      kind: 'weekly',
      period_start: period.periodStart,
      period_end: period.periodEnd
    }

    expect(formatDate(summary)).toBe('4月13日 - 4月19日')
  })
})
