import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// 模拟 createBase 返回的 CRUD 对象方法
const mockQuery: Mock = vi.fn()
const mockCreate: Mock = vi.fn()

const mockCreateBase: Mock = vi.fn(() => ({
  query: mockQuery,
  create: mockCreate
}))

vi.mock('@/services/supabase', () => ({
  default: { createBase: mockCreateBase },
  createBase: mockCreateBase
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateBase.mockReturnValue({
    query: mockQuery,
    create: mockCreate
  })
})

describe('dailyReportLog service', () => {
  it('getByUserAndDate 传入空 userId 时直接返回 null，不调用 query', async () => {
    const { dailyReportLog } = await import('@/services/db/dailyReportLog')
    const result = await dailyReportLog.getByUserAndDate('', '2026-06-05')

    expect(mockQuery).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('getByUserAndDate 传入空 reportDate 时直接返回 null，不调用 query', async () => {
    const { dailyReportLog } = await import('@/services/db/dailyReportLog')
    const result = await dailyReportLog.getByUserAndDate('u1', '')

    expect(mockQuery).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('getByUserAndDate 查询到记录时返回第一条', async () => {
    const mockRow = { id: '1', user_id: 'u1', report_date: '2026-06-05' }
    mockQuery.mockResolvedValue([mockRow])

    const { dailyReportLog } = await import('@/services/db/dailyReportLog')
    const result = await dailyReportLog.getByUserAndDate('u1', '2026-06-05')

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(chain.eq).toHaveBeenCalledWith('report_date', '2026-06-05')
    expect(chain.limit).toHaveBeenCalledWith(1)
    expect(result).toEqual(mockRow)
  })

  it('getByUserAndDate 查询结果为空数组时返回 null', async () => {
    mockQuery.mockResolvedValue([])

    const { dailyReportLog } = await import('@/services/db/dailyReportLog')
    const result = await dailyReportLog.getByUserAndDate('u1', '2026-06-05')

    expect(result).toBeNull()
  })

  it('create 委托给 base.create', async () => {
    const newLog = { id: '1', user_id: 'u1', report_date: '2026-06-05' }
    mockCreate.mockResolvedValue(newLog)

    const { dailyReportLog } = await import('@/services/db/dailyReportLog')
    const result = await dailyReportLog.create({ user_id: 'u1', report_date: '2026-06-05' })

    expect(mockCreate).toHaveBeenCalledWith({ user_id: 'u1', report_date: '2026-06-05' })
    expect(result).toEqual(newLog)
  })
})
