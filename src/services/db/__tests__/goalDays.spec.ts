import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// 模拟 createBase 返回的 CRUD 对象方法
const mockQuery: Mock = vi.fn()
const mockCreate: Mock = vi.fn()
const mockUpdate: Mock = vi.fn()
const mockDelete: Mock = vi.fn()

// 记录 createBase 调用，区分 goal_days 和 goal 表
const createBaseCalls: string[] = []
const mockCreateBase: Mock = vi.fn((tableName: string) => {
  createBaseCalls.push(tableName)
  return {
    query: mockQuery,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete
  }
})

vi.mock('@/services/supabase', () => ({
  default: { createBase: mockCreateBase }
}))

beforeEach(() => {
  vi.clearAllMocks()
  createBaseCalls.length = 0
  mockCreateBase.mockImplementation((tableName: string) => {
    createBaseCalls.push(tableName)
    return {
      query: mockQuery,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete
    }
  })
})

describe('goalDays service', () => {
  it('list 不传 monthPlanId 时按 day 升序查询全部日计划', async () => {
    const mockDays = [{ id: '1', title: '日计划A', day: '2026-06-01' }]
    mockQuery.mockResolvedValue(mockDays)

    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.list()

    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.order).toHaveBeenCalledWith('day', { ascending: true })
    expect(chain.eq).not.toHaveBeenCalled()
    expect(result).toEqual(mockDays)
  })

  it('list 传入 monthPlanId 时按 goal_month_id 过滤', async () => {
    const mockDays = [{ id: '1', goal_month_id: 'm1', day: '2026-06-01' }]
    mockQuery.mockResolvedValue(mockDays)

    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.list('m1')

    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.eq).toHaveBeenCalledWith('goal_month_id', 'm1')
    expect(result).toEqual(mockDays)
  })

  it('create 委托给 base.create', async () => {
    const newDay = { id: '1', title: '新日计划' }
    mockCreate.mockResolvedValue(newDay)

    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.create({ user_id: 'u1', title: '新日计划', day: '2026-06-05' })

    expect(mockCreate).toHaveBeenCalledWith({ user_id: 'u1', title: '新日计划', day: '2026-06-05' })
    expect(result).toEqual(newDay)
  })

  it('update 委托给 base.update', async () => {
    const updated = { id: '1', title: '已更新' }
    mockUpdate.mockResolvedValue(updated)

    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.update('1', { title: '已更新' })

    expect(mockUpdate).toHaveBeenCalledWith('1', { title: '已更新' })
    expect(result).toEqual(updated)
  })

  it('delete 委托给 base.delete', async () => {
    mockDelete.mockResolvedValue(undefined)

    const { goalDays } = await import('@/services/db/goalDays')
    await goalDays.delete('1')

    expect(mockDelete).toHaveBeenCalledWith('1')
  })

  it('deleteByIds 空数组时直接返回空数组，不调用 query', async () => {
    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.deleteByIds([])

    expect(mockQuery).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('deleteByIds 使用 in 操作批量删除', async () => {
    const deletedRows = [{ id: '1' }, { id: '2' }]
    mockQuery.mockResolvedValue(deletedRows)

    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.deleteByIds(['1', '2'])

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      delete: vi.fn().mockReturnThis(),
      'in': vi.fn().mockReturnValue(deletedRows)
    }
    const queryResult = queryFn(chain)
    expect(chain['in']).toHaveBeenCalledWith('id', ['1', '2'])
    expect(result).toEqual(deletedRows)
  })

  it('listByDate 按日期查询并 join goal_months 和 goal', async () => {
    const mockDays = [{ id: '1', day: '2026-06-05', goal_months: { id: 'm1' } }]
    mockQuery.mockResolvedValue(mockDays)

    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.listByDate(new Date('2026-06-05T00:00:00.000Z'))

    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    // 验证 join 查询包含 goal_months 和嵌套的 goal
    expect(chain.select).toHaveBeenCalledWith(expect.stringContaining('goal_months'))
    expect(chain.eq).toHaveBeenCalledWith('day', '2026-06-05')
    expect(result).toEqual(mockDays)
  })

  it('listForDayView 当 carry_over_lookback_days 全为 0 时直接调用 listByDate', async () => {
    // goalsBase.query 返回空数组（没有 carry_over_lookback_days > 0 的目标）
    // 需要让第一个 createBase 调用（goal_days 表）和第二个（goal 表）返回不同的 mock
    let queryCallIndex = 0
    mockQuery.mockImplementation(() => {
      queryCallIndex++
      // 第一次调用：getMaxCarryOverLookbackDays → 返回空数组
      // 第二次调用：listByDate → 返回结果
      if (queryCallIndex === 1) return Promise.resolve([])
      return Promise.resolve([{ id: '1', day: '2026-06-05' }])
    })

    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.listForDayView(new Date('2026-06-05T00:00:00.000Z'))

    // getMaxCarryOverLookbackDays + listByDate = 2 次 query 调用
    expect(mockQuery).toHaveBeenCalledTimes(2)
    expect(result).toEqual([{ id: '1', day: '2026-06-05' }])
  })

  it('listForDayView carry-over 过滤：仅保留当天和在回溯范围内且未完成的历史任务', async () => {
    // getMaxCarryOverLookbackDays 返回 lookback=7
    const goalsQueryResult = [{ carry_over_lookback_days: 7 }]
    // listForDayView 的 range 查询返回混合数据
    const rangeQueryResult = [
      // 当天任务，始终保留
      { id: '1', day: '2026-06-05', status: 0, goal_months: { goal: { carry_over_lookback_days: 7 } } },
      // 历史未完成任务，在回溯范围内，保留
      { id: '2', day: '2026-06-01', status: 0, goal_months: { goal: { carry_over_lookback_days: 7 } } },
      // 历史已完成任务，不保留
      { id: '3', day: '2026-06-02', status: 1, goal_months: { goal: { carry_over_lookback_days: 7 } } },
      // 历史未完成但超出回溯范围，不保留
      { id: '4', day: '2026-05-20', status: 0, goal_months: { goal: { carry_over_lookback_days: 7 } } }
    ]

    let queryCallIndex = 0
    mockQuery.mockImplementation(() => {
      queryCallIndex++
      if (queryCallIndex === 1) return Promise.resolve(goalsQueryResult)
      return Promise.resolve(rangeQueryResult)
    })

    const { goalDays } = await import('@/services/db/goalDays')
    const result = await goalDays.listForDayView(new Date('2026-06-05T00:00:00.000Z'))

    // 应保留 id=1（当天）和 id=2（历史未完成且在回溯范围内）
    expect(result).toHaveLength(2)
    expect(result.map(r => r.id)).toEqual(['1', '2'])
  })
})
