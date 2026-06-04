import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({
  useRoute: vi.fn()
}))

vi.mock('@/stores/dateStore', () => ({
  useDateStore: vi.fn()
}))

vi.mock('@/services/database', () => ({
  db: {
    task: {
      list: vi.fn(),
      update: vi.fn()
    },
    goalDays: {
      listForDayView: vi.fn(),
      listByDate: vi.fn(),
      update: vi.fn()
    },
    habit: {
      list: vi.fn(),
      listLogsByDate: vi.fn(),
      log: vi.fn(),
      deleteLog: vi.fn()
    }
  }
}))

vi.mock('@/utils/audio', () => ({
  playSuccessSound: vi.fn()
}))

vi.mock('@/stores/pomodoroStore', () => ({
  usePomodoroStore: vi.fn(() => ({
    activeTask: null,
    setActiveTask: vi.fn()
  }))
}))

vi.mock('@/utils/goalDayStatus', () => ({
  toGoalDayStatus: vi.fn((completed: boolean) => completed ? 1 : 0)
}))

vi.mock('@/views/habits/utils/habitFrequency', () => ({
  matchesHabitFrequency: vi.fn(() => true)
}))

import { useRoute } from 'vue-router'
import { useDateStore } from '@/stores/dateStore'
import { db } from '@/services/database'
import { useDayStore } from '@/stores/dayStore'

// 将 mock 后的模块函数断言为 Mock 类型，以便调用 mockReturnValue 等方法
const mockUseRoute = useRoute as unknown as Mock
const mockUseDateStore = useDateStore as unknown as Mock

describe('useDayData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())

    mockUseRoute.mockReturnValue({
      params: {
        year: '2026',
        month: '4',
        day: '28'
      }
    })

    mockUseDateStore.mockReturnValue({
      currentDate: new Date(2026, 3, 29)
    })

    ;(db.task.list as Mock).mockResolvedValue([])
    ;(db.task.update as Mock).mockResolvedValue({})
    ;(db.goalDays.listForDayView as Mock).mockResolvedValue([])
    ;(db.goalDays.listByDate as Mock).mockResolvedValue([])
    ;(db.goalDays.update as Mock).mockResolvedValue({})
    ;(db.habit.list as Mock).mockResolvedValue([])
    ;(db.habit.listLogsByDate as Mock).mockResolvedValue([])
    ;(db.habit.log as Mock).mockResolvedValue({})
    ;(db.habit.deleteLog as Mock).mockResolvedValue(undefined)
  })

  it('查看昨天时，补打卡会把习惯日志写入当前路由日期', async () => {
    const store = useDayStore()

    await store.handleToggleComplete({
      id: 'habit-1',
      type: 'habit',
      completed: false
    })

    expect(db.habit.log).toHaveBeenCalledTimes(1)
    expect(db.habit.log).toHaveBeenCalledWith('habit-1', '', expect.any(String))

    const logMock = db.habit.log as Mock
    const completedAt = new Date(logMock.mock.calls[0][2] as string)
    expect(completedAt.getFullYear()).toBe(2026)
    expect(completedAt.getMonth()).toBe(3)
    expect(completedAt.getDate()).toBe(28)
  })

  it('查看昨天时，取消打卡会在当前路由日期范围内查找日志', async () => {
    ;(db.habit.listLogsByDate as Mock).mockResolvedValue([
      { id: 'log-1', habit_id: 'habit-1' }
    ])

    const store = useDayStore()

    await store.handleToggleComplete({
      id: 'habit-1',
      type: 'habit',
      completed: true
    })

    expect(db.habit.listLogsByDate).toHaveBeenCalledTimes(2)

    const listLogsMock = db.habit.listLogsByDate as Mock
    const [startOfDay, endOfDay] = listLogsMock.mock.calls[0] as [Date, Date]
    expect(startOfDay.getFullYear()).toBe(2026)
    expect(startOfDay.getMonth()).toBe(3)
    expect(startOfDay.getDate()).toBe(28)
    expect(startOfDay.getHours()).toBe(0)
    expect(endOfDay.getFullYear()).toBe(2026)
    expect(endOfDay.getMonth()).toBe(3)
    expect(endOfDay.getDate()).toBe(28)
    expect(endOfDay.getHours()).toBe(23)

    expect(db.habit.deleteLog).toHaveBeenCalledWith('log-1')
  })

  it('切换日计划完成状态时会把布尔完成态转换为 daily plan status', async () => {
    const store = useDayStore()

    await store.handleToggleComplete({
      id: 'plan-1',
      type: 'goal_day',
      completed: false
    })

    expect(db.goalDays.update).toHaveBeenCalledWith('plan-1', { status: 1 })
  })

  it('fetches daily plans through the day-view carry-over query', async () => {
    ;(db.goalDays.listForDayView as Mock).mockResolvedValue([
      { id: 'plan-today', title: '今天任务', day: '2026-04-28', status: 0, task_time: '09:00', duration: 30 },
      { id: 'plan-old', title: '昨天任务', day: '2026-04-27', status: 0, task_time: '10:00', duration: 30 }
    ])

    const store = useDayStore()
    await store.fetchTasks({ showLoading: false })

    expect(db.goalDays.listForDayView).toHaveBeenCalledTimes(1)
    expect(db.goalDays.listForDayView).toHaveBeenCalledWith(expect.any(Date))
  })
})
