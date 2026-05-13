import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRoute: vi.fn()
}))

vi.mock('@/stores/dateStore', () => ({
  useDateStore: vi.fn()
}))

vi.mock('@/services/database', () => ({
  db: {
    tasks: {
      list: vi.fn(),
      update: vi.fn()
    },
    dailyPlans: {
      listForDayView: vi.fn(),
      listByDate: vi.fn(),
      update: vi.fn()
    },
    habits: {
      listLite: vi.fn(),
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

import { useRoute } from 'vue-router'
import { useDateStore } from '@/stores/dateStore'
import { db } from '@/services/database'
import { useDayData } from '@/views/day/composables/useDayData'

describe('useDayData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useRoute.mockReturnValue({
      params: {
        year: '2026',
        month: '4',
        day: '28'
      }
    })

    // 故意让全局 currentDate 保持今天，用来证明 day 页切换习惯时必须以路由日期为准。
    useDateStore.mockReturnValue({
      currentDate: new Date(2026, 3, 29)
    })

    db.task.list.mockResolvedValue([])
    db.goalDays.listForDayView.mockResolvedValue([])
    db.goalDays.listByDate.mockResolvedValue([])
    db.goalDays.update.mockResolvedValue({})
    db.habit.listLite.mockResolvedValue([])
    db.habit.listLogsByDate.mockResolvedValue([])
    db.habit.log.mockResolvedValue({})
    db.habit.deleteLog.mockResolvedValue()
  })

  it('查看昨天时，补打卡会把习惯日志写入当前路由日期', async () => {
    const { handleToggleComplete } = useDayData()

    await handleToggleComplete({
      id: 'habit-1',
      type: 'habit',
      completed: false
    })

    expect(db.habit.log).toHaveBeenCalledTimes(1)
    expect(db.habit.log).toHaveBeenCalledWith('habit-1', '', expect.any(String))

    const completedAt = new Date(db.habit.log.mock.calls[0][2])
    expect(completedAt.getFullYear()).toBe(2026)
    expect(completedAt.getMonth()).toBe(3)
    expect(completedAt.getDate()).toBe(28)
  })

  it('查看昨天时，取消打卡会在当前路由日期范围内查找日志', async () => {
    db.habit.listLogsByDate.mockResolvedValue([
      { id: 'log-1', habit_id: 'habit-1' }
    ])

    const { handleToggleComplete } = useDayData()

    await handleToggleComplete({
      id: 'habit-1',
      type: 'habit',
      completed: true
    })

    expect(db.habit.listLogsByDate).toHaveBeenCalledTimes(2)

    const [startOfDay, endOfDay] = db.habit.listLogsByDate.mock.calls[0]
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
    const { handleToggleComplete } = useDayData()

    await handleToggleComplete({
      id: 'plan-1',
      type: 'daily_plan',
      completed: false
    })

    expect(db.goalDays.update).toHaveBeenCalledWith('plan-1', { status: 1 })
  })

  it('fetches daily plans through the day-view carry-over query', async () => {
    db.goalDays.listForDayView.mockResolvedValue([
      { id: 'plan-today', title: '今天任务', day: '2026-04-28', status: 0, task_time: '09:00', duration: 30 },
      { id: 'plan-old', title: '昨天任务', day: '2026-04-27', status: 0, task_time: '10:00', duration: 30 }
    ])

    const { fetchTasks, dailySchedule } = useDayData()
    await fetchTasks({ showLoading: false })

    expect(db.goalDays.listForDayView).toHaveBeenCalledTimes(1)
    expect(db.goalDays.listForDayView).toHaveBeenCalledWith(expect.any(Date))
    expect(dailySchedule.value.filter(item => item.type === 'daily_plan')).toHaveLength(2)
  })
})
