import { describe, expect, it } from 'vitest'
import { buildDailySummaryPrefill } from '@/views/summary/composables/useSummaryPrefill'

describe('useSummaryPrefill', () => {
  it('builds prefill content from completed tasks, habits and direction items', () => {
    const payload = buildDailySummaryPrefill({
      tasks: [{ title: '完成客户提案', completed: true }],
      habits: [{ title: '晨读', completed: true }],
      directionItems: [{ title: '推进季度目标', sourceMeta: { planTitle: '增长' } }]
    })

    expect(payload.done).toContain('完成客户提案')
    expect(payload.done).toContain('晨读')
    expect(payload.tomorrow).toContain('增长')
  })

  it('returns empty strings when no data provided', () => {
    const payload = buildDailySummaryPrefill({})

    expect(payload.done).toBe('')
    expect(payload.improve).toBe('')
    expect(payload.tomorrow).toBe('')
  })

  it('skips incomplete tasks and habits', () => {
    const payload = buildDailySummaryPrefill({
      tasks: [{ title: '未完成任务', completed: false }],
      habits: [{ title: '未打卡习惯', completed: false }]
    })

    expect(payload.done).toBe('')
  })
})
