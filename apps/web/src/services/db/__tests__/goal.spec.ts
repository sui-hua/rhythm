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
  default: { createBase: mockCreateBase },
  createBase: mockCreateBase
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

describe('goal service', () => {
  it('list 使用 join 查询 goal_categories 并按 priority 和 created_at 降序排列', async () => {
    const mockGoals = [
      { id: '1', title: '目标A', goal_categories: { id: 'c1', name: '分类1' } }
    ]
    mockQuery.mockResolvedValue(mockGoals)

    const { goal } = await import('@/services/db/goal')
    const result = await goal.list()

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    // 验证 join 查询
    expect(chain.select).toHaveBeenCalledWith('*, goal_categories(id, name)')
    // 验证双重排序：priority 降序 → created_at 降序
    expect(chain.order).toHaveBeenCalledWith('priority', { ascending: false })
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual(mockGoals)
  })

  it('create 委托给 base.create', async () => {
    const newGoal = { id: '1', title: '新目标' }
    mockCreate.mockResolvedValue(newGoal)

    const { goal } = await import('@/services/db/goal')
    const result = await goal.create({ title: '新目标' })

    expect(mockCreate).toHaveBeenCalledWith({ title: '新目标' })
    expect(result).toEqual(newGoal)
  })

  it('update 委托给 base.update', async () => {
    const updated = { id: '1', title: '已更新' }
    mockUpdate.mockResolvedValue(updated)

    const { goal } = await import('@/services/db/goal')
    const result = await goal.update('1', { title: '已更新' })

    expect(mockUpdate).toHaveBeenCalledWith('1', { title: '已更新' })
    expect(result).toEqual(updated)
  })

  it('delete 委托给 base.delete', async () => {
    mockDelete.mockResolvedValue(undefined)

    const { goal } = await import('@/services/db/goal')
    await goal.delete('1')

    expect(mockDelete).toHaveBeenCalledWith('1')
  })
})
