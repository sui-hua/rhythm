import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// 模拟 createBase 返回的 CRUD 对象方法
const mockQuery: Mock = vi.fn()
const mockCreate: Mock = vi.fn()
const mockUpdate: Mock = vi.fn()
const mockDelete: Mock = vi.fn()
const mockGetById: Mock = vi.fn()

// createBase 工厂函数，返回固定的 mock CRUD 对象
const mockCreateBase: Mock = vi.fn(() => ({
  query: mockQuery,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete,
  getById: mockGetById
}))

vi.mock('@/services/supabase', () => ({
  default: { createBase: mockCreateBase }
}))

beforeEach(() => {
  vi.clearAllMocks()
  // 每次 createBase 都返回干净的 mock 对象
  mockCreateBase.mockReturnValue({
    query: mockQuery,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    getById: mockGetById
  })
})

describe('task service', () => {
  it('list 按 start_time 升序查询，不传时间参数时不添加范围过滤', async () => {
    const mockTasks = [{ id: '1', title: '任务A' }]
    mockQuery.mockResolvedValue(mockTasks)

    const { task } = await import('@/services/db/task')
    const result = await task.list()

    expect(mockQuery).toHaveBeenCalledTimes(1)
    // query 接收一个回调函数，调用时传入链式查询对象
    const queryFn = mockQuery.mock.calls[0][0]
    // 构造链式调用的 mock，验证 order 被调用
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.order).toHaveBeenCalledWith('start_time', { ascending: true })
    // 不传 start/end 时不应调用 gte/lte
    expect(chain.gte).not.toHaveBeenCalled()
    expect(chain.lte).not.toHaveBeenCalled()
    expect(result).toEqual(mockTasks)
  })

  it('list 传入 start 和 end 时添加 gte/lte 范围过滤', async () => {
    mockQuery.mockResolvedValue([])

    const { task } = await import('@/services/db/task')
    const start = new Date('2026-06-01T00:00:00.000Z')
    const end = new Date('2026-06-30T23:59:59.000Z')
    await task.list(start, end)

    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.gte).toHaveBeenCalledWith('start_time', start.toISOString())
    expect(chain.lte).toHaveBeenCalledWith('start_time', end.toISOString())
  })

  it('listInbox 过滤 status=inbox 并按 created_at 降序排列', async () => {
    const mockInbox = [{ id: '1', title: '收件箱任务', status: 'inbox' }]
    mockQuery.mockResolvedValue(mockInbox)

    const { task } = await import('@/services/db/task')
    const result = await task.listInbox()

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.eq).toHaveBeenCalledWith('status', 'inbox')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual(mockInbox)
  })

  it('create 委托给 base.create', async () => {
    const newTask = { id: '2', title: '新任务' }
    mockCreate.mockResolvedValue(newTask)

    const { task } = await import('@/services/db/task')
    const result = await task.create({ title: '新任务' })

    expect(mockCreate).toHaveBeenCalledWith({ title: '新任务' })
    expect(result).toEqual(newTask)
  })

  it('update 委托给 base.update', async () => {
    const updated = { id: '1', title: '已更新' }
    mockUpdate.mockResolvedValue(updated)

    const { task } = await import('@/services/db/task')
    const result = await task.update('1', { title: '已更新' })

    expect(mockUpdate).toHaveBeenCalledWith('1', { title: '已更新' })
    expect(result).toEqual(updated)
  })

  it('delete 委托给 base.delete', async () => {
    mockDelete.mockResolvedValue(undefined)

    const { task } = await import('@/services/db/task')
    await task.delete('1')

    expect(mockDelete).toHaveBeenCalledWith('1')
  })

  it('getById 委托给 base.getById', async () => {
    const found = { id: '1', title: '查询任务' }
    mockGetById.mockResolvedValue(found)

    const { task } = await import('@/services/db/task')
    const result = await task.getById('1')

    expect(mockGetById).toHaveBeenCalledWith('1')
    expect(result).toEqual(found)
  })
})
