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

describe('goalCategories service', () => {
  it('list 按 name 升序查询所有分类', async () => {
    const mockCategories = [
      { id: '1', name: '工作' },
      { id: '2', name: '学习' }
    ]
    mockQuery.mockResolvedValue(mockCategories)

    const { goalCategories } = await import('@/services/db/goalCategories')
    const result = await goalCategories.list()

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.order).toHaveBeenCalledWith('name', { ascending: true })
    expect(result).toEqual(mockCategories)
  })

  it('create 委托给 base.create', async () => {
    const newCategory = { id: '1', name: '健康' }
    mockCreate.mockResolvedValue(newCategory)

    const { goalCategories } = await import('@/services/db/goalCategories')
    const result = await goalCategories.create({ user_id: 'u1', name: '健康' })

    expect(mockCreate).toHaveBeenCalledWith({ user_id: 'u1', name: '健康' })
    expect(result).toEqual(newCategory)
  })

  it('update 委托给 base.update', async () => {
    const updated = { id: '1', name: '运动' }
    mockUpdate.mockResolvedValue(updated)

    const { goalCategories } = await import('@/services/db/goalCategories')
    const result = await goalCategories.update('1', { name: '运动' })

    expect(mockUpdate).toHaveBeenCalledWith('1', { name: '运动' })
    expect(result).toEqual(updated)
  })

  it('delete 委托给 base.delete', async () => {
    mockDelete.mockResolvedValue(undefined)

    const { goalCategories } = await import('@/services/db/goalCategories')
    await goalCategories.delete('1')

    expect(mockDelete).toHaveBeenCalledWith('1')
  })
})
