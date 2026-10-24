import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { GoalDay } from '@/services/db/goalDays'

// mock db
vi.mock('@/services/database', () => ({
  db: {
    goalDays: {
      update: vi.fn()
    }
  }
}))

// mock goalBatchStore
const mockDailyTasks: Record<string, GoalDay> = {}

const goalDay = (overrides: Partial<GoalDay> = {}): GoalDay => ({
  id: 'task-1',
  user_id: 'user-1',
  title: '旧标题',
  status: 'active',
  day: '2026-06-12',
  task_time: '09:00',
  duration: 30,
  ...overrides
})

vi.mock('@/stores/goalBatchStore', () => ({
  useGoalBatchStore: () => ({
    dailyTasks: mockDailyTasks
  })
}))

import { db } from '@/services/database'
import { useDirectionTasks } from '../useDirectionTasks'

describe('useDirectionTasks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    for (const key of Object.keys(mockDailyTasks)) delete mockDailyTasks[key]
  })

  // handleUpdateTask：null task 时早返回，不调用数据库
  it('handleUpdateTask task 为 null 时直接返回', async () => {
    const { handleUpdateTask } = useDirectionTasks()
    await handleUpdateTask(null, { title: 'new' })
    expect(db.goalDays.update).not.toHaveBeenCalled()
  })

  // handleUpdateTask：task.id 为空时早返回
  it('handleUpdateTask task.id 为空时直接返回', async () => {
    const { handleUpdateTask } = useDirectionTasks()
    await handleUpdateTask(goalDay({ id: '' }), { title: 'new' })
    expect(db.goalDays.update).not.toHaveBeenCalled()
  })

  // handleUpdateTask：正常更新数据库并同步 store
  it('handleUpdateTask 正常更新数据库并同步 store', async () => {
    vi.mocked(db.goalDays.update).mockResolvedValue(undefined)
    mockDailyTasks['key-1'] = goalDay()

    const { handleUpdateTask } = useDirectionTasks()
    await handleUpdateTask(
      goalDay(),
      { title: '新标题' }
    )

    expect(db.goalDays.update).toHaveBeenCalledWith('task-1', {
      title: '新标题',
      task_time: '09:00',
      duration: 30
    })
    expect(mockDailyTasks['key-1'].title).toBe('新标题')
  })

  // handleUpdateTask：payload 中的字段覆盖原值
  it('handleUpdateTask payload 字段覆盖原 task 值', async () => {
    vi.mocked(db.goalDays.update).mockResolvedValue(undefined)
    mockDailyTasks['key-2'] = goalDay({ id: 'task-2', title: '标题', task_time: '10:00', duration: 60 })

    const { handleUpdateTask } = useDirectionTasks()
    await handleUpdateTask(
      goalDay({ id: 'task-2', title: '标题', task_time: '10:00', duration: 60 }),
      { task_time: '14:00', duration: 45 }
    )

    expect(db.goalDays.update).toHaveBeenCalledWith('task-2', {
      title: '标题',
      task_time: '14:00',
      duration: 45
    })
  })

  // handleUpdateTask：数据库异常时不抛出，静默处理
  it('handleUpdateTask 数据库异常时静默处理', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(db.goalDays.update).mockRejectedValue(new Error('db error'))

    const { handleUpdateTask } = useDirectionTasks()
    await expect(
      handleUpdateTask(goalDay({ title: 't' }), { title: 'new' })
    ).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
