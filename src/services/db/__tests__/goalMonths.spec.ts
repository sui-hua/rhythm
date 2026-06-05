import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// 模拟 createBase 返回的 CRUD 对象方法
const mockQuery: Mock = vi.fn()
const mockCreate: Mock = vi.fn()
const mockUpdate: Mock = vi.fn()
const mockDelete: Mock = vi.fn()

const mockCreateBase: Mock = vi.fn(() => ({
  query: mockQuery,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete
}))

vi.mock('@/services/supabase', () => ({
  default: { createBase: mockCreateBase }
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateBase.mockReturnValue({
    query: mockQuery,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete
  })
})

describe('goalMonths service', () => {
  it('list 不传 goalId 时按 month 升序查询全部月度计划', async () => {
    const mockMonths = [{ id: '1', title: '六月计划', month: '2026-06' }]
    mockQuery.mockResolvedValue(mockMonths)

    const { goalMonths } = await import('@/services/db/goalMonths')
    const result = await goalMonths.list()

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.order).toHaveBeenCalledWith('month', { ascending: true })
    // 不传 goalId 时不应调用 eq
    expect(chain.eq).not.toHaveBeenCalled()
    expect(result).toEqual(mockMonths)
  })

  it('list 传入 goalId 时按 goal_id 过滤', async () => {
    const mockMonths = [{ id: '1', goal_id: 'g1', month: '2026-06' }]
    mockQuery.mockResolvedValue(mockMonths)

    const { goalMonths } = await import('@/services/db/goalMonths')
    const result = await goalMonths.list('g1')

    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.eq).toHaveBeenCalledWith('goal_id', 'g1')
    expect(result).toEqual(mockMonths)
  })

  it('create 委托给 base.create', async () => {
    const newMonth = { id: '1', title: '新月计划' }
    mockCreate.mockResolvedValue(newMonth)

    const { goalMonths } = await import('@/services/db/goalMonths')
    const result = await goalMonths.create({ user_id: 'u1', title: '新月计划' })

    expect(mockCreate).toHaveBeenCalledWith({ user_id: 'u1', title: '新月计划' })
    expect(result).toEqual(newMonth)
  })

  it('update 委托给 base.update', async () => {
    const updated = { id: '1', title: '已更新' }
    mockUpdate.mockResolvedValue(updated)

    const { goalMonths } = await import('@/services/db/goalMonths')
    const result = await goalMonths.update('1', { title: '已更新' })

    expect(mockUpdate).toHaveBeenCalledWith('1', { title: '已更新' })
    expect(result).toEqual(updated)
  })

  it('delete 委托给 base.delete', async () => {
    mockDelete.mockResolvedValue(undefined)

    const { goalMonths } = await import('@/services/db/goalMonths')
    await goalMonths.delete('1')

    expect(mockDelete).toHaveBeenCalledWith('1')
  })
})
