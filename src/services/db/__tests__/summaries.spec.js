import { beforeEach, describe, expect, it, vi } from 'vitest'

const selectSingle = vi.fn()
const insert = vi.fn()
const update = vi.fn()
const deleteFn = vi.fn()
const from = vi.fn()
const client = { from }

vi.mock('@/config/supabase', () => ({
  default: client
}))

vi.mock('@/composables/useGlobalLoading', () => ({
  trackGlobalLoading: (fn) => fn()
}))

vi.mock('@/views/summary/utils/summaryAdapters', () => ({
  mapSummaryRowToRecord: (row) => row
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
    const { summaries } = await import('@/services/db/summaries')

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
