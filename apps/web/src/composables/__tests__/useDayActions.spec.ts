import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDayActions } from '@/composables/useDayActions'
import { db } from '@/services/database'
import type { HabitLog } from '@/services/db/habit'
import type { DailyScheduleItem } from '@/types/models'

vi.mock('@/services/database', () => ({
  db: {
    task: {
      getById: vi.fn(),
      update: vi.fn()
    },
    habit: {
      log: vi.fn(),
      listLogsByDate: vi.fn(),
      deleteLog: vi.fn()
    },
    goalDays: {
      update: vi.fn()
    }
  }
}))

vi.mock('@/utils/audio', () => ({
  playSuccessSound: vi.fn()
}))

vi.mock('@/stores/dateStore', () => ({
  useDateStore: vi.fn(() => ({ currentDate: new Date(2026, 3, 28) }))
}))

const mockFeedbackError = vi.fn()
vi.mock('@/composables/useActionFeedback', () => ({
  useActionFeedback: () => ({
    success: vi.fn(),
    error: mockFeedbackError
  })
}))

describe('useDayActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('习惯打卡返回已有同日记录时不重复追加到本地 habitLogs', async () => {
    const existingLog: HabitLog = {
      id: 'log-1',
      habit_id: 'habit-1',
      completed_at: '2026-04-28T00:00:00.000Z',
      log: ''
    }
    const habitLogs = ref<HabitLog[]>([existingLog])
    vi.mocked(db.habit.log).mockResolvedValue(existingLog)

    const { handleToggleComplete } = useDayActions({
      tasks: ref([]),
      routeDateContext: ref({ year: 2026, month: 4, day: 28 }),
      dailySchedule: ref([]),
      habitLogs,
      goalDays: ref([])
    })

    await handleToggleComplete({
      id: 'habit-1',
      type: 'habit',
      completed: false
    } as DailyScheduleItem)

    expect(db.habit.log).toHaveBeenCalledWith('habit-1', '', expect.any(Date))
    expect(habitLogs.value).toEqual([existingLog])
  })

  it('任务完成状态更新失败时回滚并提示用户', async () => {
    vi.mocked(db.task.update).mockRejectedValue(new Error('update failed'))
    const task = {
      id: 'task-1',
      type: 'task',
      sourceLabel: 'task',
      completed: false,
      original: { id: 'task-1', title: '任务', completed: false },
      title: '任务',
      description: '',
      category: '个人任务',
      duration: '30m',
      durationHours: 0.5,
      rawDuration: 0.5,
      time: '09:00'
    } as DailyScheduleItem

    const { handleToggleComplete } = useDayActions({
      tasks: ref([]),
      routeDateContext: ref({ year: 2026, month: 4, day: 28 }),
      dailySchedule: ref([task]),
      habitLogs: ref([]),
      goalDays: ref([])
    })

    await handleToggleComplete(task)

    expect(task.completed).toBe(false)
    expect(mockFeedbackError).toHaveBeenCalledWith('状态更新失败，已恢复原状态', expect.any(Error))
  })

  it('开始计时失败时清除乐观状态并提示用户', async () => {
    vi.mocked(db.task.update).mockRejectedValue(new Error('start failed'))
    const task = {
      id: 'task-1',
      type: 'task',
      completed: false,
      title: '任务',
      original: { id: 'task-1', title: '任务', start_time: '2026-04-28T09:00:00.000Z', end_time: '2026-04-28T09:30:00.000Z' }
    } as DailyScheduleItem

    const { handleStartTask } = useDayActions({
      tasks: ref([]),
      routeDateContext: ref({ year: 2026, month: 4, day: 28 }),
      dailySchedule: ref([]),
      habitLogs: ref([]),
      goalDays: ref([])
    })

    const result = await handleStartTask(task)

    expect(result).toBeNull()
    expect(task.actual_start_time).toBeNull()
    expect(mockFeedbackError).toHaveBeenCalledWith('开始计时失败，请稍后重试', expect.any(Error))
  })

  it('拖拽更新时间失败时提示用户', async () => {
    vi.mocked(db.task.update).mockRejectedValue(new Error('time failed'))
    const task = {
      id: 'task-1',
      type: 'task',
      original: {
        id: 'task-1',
        title: '任务',
        start_time: '2026-04-28T09:00:00.000Z',
        end_time: '2026-04-28T09:30:00.000Z'
      }
    } as DailyScheduleItem

    const { updateTaskTime } = useDayActions({
      tasks: ref([]),
      routeDateContext: ref({ year: 2026, month: 4, day: 28 }),
      dailySchedule: ref([]),
      habitLogs: ref([]),
      goalDays: ref([])
    })

    await updateTaskTime(task, 10, 11)

    expect(mockFeedbackError).toHaveBeenCalledWith('更新时间失败，已恢复原时间', expect.any(Error))
  })
})
