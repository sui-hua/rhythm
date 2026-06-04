import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// 模拟 Supabase 客户端的链式调用方法
const selectSingle: Mock = vi.fn()
const insert: Mock = vi.fn()
const update: Mock = vi.fn()
const deleteFn: Mock = vi.fn()
const from: Mock = vi.fn()
const client = { from }

vi.mock('@/services/supabase', () => ({
  default: client
}))

vi.mock('@/composables/useGlobalLoading', () => ({
  trackGlobalLoading: (fn: () => void) => fn()
}))

vi.mock('@/views/summary/utils/summaryAdapters', () => ({
  mapSummaryRowToRecord: (row: unknown) => row
}))

beforeEach(() => {
  vi.clearAllMocks()

  selectSingle.mockResolvedValue({
    data: {
      id: 'summary-1',
      kind: 'daily'
    },
    error: null
  })

  insert.mockReturnValue({
    select: vi.fn(() => ({
      single: selectSingle
    }))
  })

  update.mockReturnValue({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        single: selectSingle
      }))
    }))
  })

  deleteFn.mockReturnValue({
    eq: vi.fn(() => ({ error: null }))
  })

  from.mockReturnValue({
    insert,
    update,
    delete: deleteFn
  })
})

describe('summaries service', () => {
  it('saves a summary without legacy scope bridging', async () => {
    const { summary: summaries } = await import('@/services/db/summary')

    await summaries.save({
      kind: 'daily',
      period_start: '2026-04-18T00:00:00.000Z',
      period_end: '2026-04-18T23:59:59.000Z',
      content: {
        done: '完成任务'
      },
      user_id: 'u1'
    })

    expect(insert).toHaveBeenCalledTimes(1)
    expect(insert).toHaveBeenCalledWith(expect.not.objectContaining({
      scope: expect.anything()
    }))
  })
})
