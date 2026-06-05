import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// 模拟 createBase 返回的 CRUD 对象方法
const mockQuery: Mock = vi.fn()
const mockCreate: Mock = vi.fn()
const mockUpdate: Mock = vi.fn()
const mockDelete: Mock = vi.fn()

// 记录 createBase 的调用，区分 habitsBase 和 habitLogsBase
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

describe('habit service', () => {
  it('list 按 created_at 升序查询所有习惯', async () => {
    const mockHabits = [{ id: '1', name: '跑步' }]
    mockQuery.mockResolvedValue(mockHabits)

    const { habit } = await import('@/services/db/habit')
    const result = await habit.list()

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result).toEqual(mockHabits)
  })

  it('listLogsByDate 按 completed_at 范围查询打卡记录', async () => {
    const mockLogs = [{ id: '1', habit_id: '1', completed_at: '2026-06-01T10:00:00Z' }]
    mockQuery.mockResolvedValue(mockLogs)

    const { habit } = await import('@/services/db/habit')
    const start = new Date('2026-06-01T00:00:00.000Z')
    const end = new Date('2026-06-30T23:59:59.000Z')
    const result = await habit.listLogsByDate(start, end)

    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.gte).toHaveBeenCalledWith('completed_at', start.toISOString())
    expect(chain.lte).toHaveBeenCalledWith('completed_at', end.toISOString())
    expect(result).toEqual(mockLogs)
  })

  it('listLogsByHabit 按 habit_id 过滤并按 completed_at 升序排列', async () => {
    const mockLogs = [{ id: '1', habit_id: 'h1' }]
    mockQuery.mockResolvedValue(mockLogs)

    const { habit } = await import('@/services/db/habit')
    const result = await habit.listLogsByHabit('h1')

    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    expect(chain.eq).toHaveBeenCalledWith('habit_id', 'h1')
    expect(chain.order).toHaveBeenCalledWith('completed_at', { ascending: true })
    expect(result).toEqual(mockLogs)
  })

  it('listLogsByYear 查询整年范围并按 completed_at 升序排列', async () => {
    const mockLogs = [{ id: '1', habit_id: 'h1' }]
    mockQuery.mockResolvedValue(mockLogs)

    const { habit } = await import('@/services/db/habit')
    const result = await habit.listLogsByYear(2026)

    const queryFn = mockQuery.mock.calls[0][0]
    const chain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    }
    queryFn(chain)
    // 验证年份范围：2026-01-01 ~ 2026-12-31 23:59:59
    expect(chain.gte).toHaveBeenCalledWith('completed_at', new Date(2026, 0, 1).toISOString())
    expect(chain.lte).toHaveBeenCalledWith('completed_at', new Date(2026, 11, 31, 23, 59, 59).toISOString())
    expect(chain.order).toHaveBeenCalledWith('completed_at', { ascending: true })
    expect(result).toEqual(mockLogs)
  })

  it('create 委托给 habitsBase.create', async () => {
    const newHabit = { id: '1', name: '早起' }
    mockCreate.mockResolvedValue(newHabit)

    const { habit } = await import('@/services/db/habit')
    const result = await habit.create({ name: '早起' })

    expect(mockCreate).toHaveBeenCalledWith({ name: '早起' })
    expect(result).toEqual(newHabit)
  })

  it('update 委托给 habitsBase.update', async () => {
    const updated = { id: '1', name: '晨跑' }
    mockUpdate.mockResolvedValue(updated)

    const { habit } = await import('@/services/db/habit')
    const result = await habit.update('1', { name: '晨跑' })

    expect(mockUpdate).toHaveBeenCalledWith('1', { name: '晨跑' })
    expect(result).toEqual(updated)
  })

  it('delete 委托给 habitsBase.delete', async () => {
    mockDelete.mockResolvedValue(undefined)

    const { habit } = await import('@/services/db/habit')
    await habit.delete('1')

    expect(mockDelete).toHaveBeenCalledWith('1')
  })

  it('log 创建打卡记录，completedAt 为 null 时不设置 completed_at', async () => {
    const newLog = { id: '1', habit_id: 'h1', log: '完成' }
    mockCreate.mockResolvedValue(newLog)

    const { habit } = await import('@/services/db/habit')
    const result = await habit.log('h1', '完成', null)

    expect(mockCreate).toHaveBeenCalledWith({ habit_id: 'h1', log: '完成' })
    expect(result).toEqual(newLog)
  })

  it('log 创建打卡记录，completedAt 有值时设置 completed_at', async () => {
    const completedAt = new Date('2026-06-05T10:00:00.000Z')
    const newLog = { id: '1', habit_id: 'h1', log: '', completed_at: completedAt.toISOString() }
    mockCreate.mockResolvedValue(newLog)

    const { habit } = await import('@/services/db/habit')
    const result = await habit.log('h1', '', completedAt)

    expect(mockCreate).toHaveBeenCalledWith({
      habit_id: 'h1',
      log: '',
      completed_at: completedAt.toISOString()
    })
    expect(result).toEqual(newLog)
  })

  it('deleteLog 委托给 habitLogsBase.delete', async () => {
    mockDelete.mockResolvedValue(undefined)

    const { habit } = await import('@/services/db/habit')
    await habit.deleteLog('log-1')

    expect(mockDelete).toHaveBeenCalledWith('log-1')
  })
})
