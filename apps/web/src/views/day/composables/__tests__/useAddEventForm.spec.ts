import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import type { AddEventFormProps, AddEventFormEmit } from '@/views/day/composables/useAddEventForm'

const mockFetchTasks = vi.fn()

vi.mock('@/services/database', () => ({
  db: {
    task: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    habit: { update: vi.fn(), delete: vi.fn() },
    goalDays: { update: vi.fn(), delete: vi.fn() }
  }
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ userId: 'user-1' }))
}))

vi.mock('@/stores/dateStore', () => ({
  useDateStore: vi.fn(() => ({ currentDate: new Date(2026, 4, 8) }))
}))

vi.mock('@/stores/dayStore', () => ({
  useDayStore: vi.fn(() => ({ fetchTasks: mockFetchTasks }))
}))

vi.mock('@/views/day/composables/useActionFeedback', () => ({
  useActionFeedback: vi.fn(() => ({ success: vi.fn(), error: vi.fn() }))
}))

vi.mock('@/composables/useDeleteConfirm', () => ({
  confirmDelete: vi.fn(() => true)
}))

import { db } from '@/services/database'
import { useAddEventForm } from '@/views/day/composables/useAddEventForm'
import type { Task } from '@/services/db/task'

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })

  return { promise, resolve }
}

describe('useAddEventForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchTasks.mockResolvedValue(undefined)
  })

  it('打开新增弹窗时先隐藏标题错误，字段触碰后再显示', () => {
    const props = reactive<AddEventFormProps>({ show: true, initialData: null })
    const emit: AddEventFormEmit = vi.fn()

    const { errors, isValid, markFieldTouched } = useAddEventForm(props, emit)

    expect(isValid.value).toBe(false)
    expect(errors.value.title).toBe('')

    markFieldTouched('title')

    expect(errors.value.title).toBe('任务名称不能为空')
  })

  it('新增任务 pending 时重复提交只创建一次', async () => {
    const gate = deferred<Task>()
    vi.mocked(db.task.create).mockReturnValue(gate.promise)
    const props = reactive<AddEventFormProps>({ show: true, initialData: null })
    const emit: AddEventFormEmit = vi.fn()

    const { eventForm, submit, isSubmitting } = useAddEventForm(props, emit)
    eventForm.title = '写周报'
    eventForm.time = '09:00'
    eventForm.duration = 0.5

    const first = submit()
    const second = submit()

    expect(isSubmitting.value).toBe(true)
    expect(db.task.create).toHaveBeenCalledTimes(1)

    gate.resolve({ id: 'task-1', title: '写周报' })
    await first
    await second

    expect(db.task.create).toHaveBeenCalledTimes(1)
    expect(isSubmitting.value).toBe(false)
  })

  it('删除任务 pending 时重复触发只删除一次', async () => {
    const gate = deferred()
    vi.mocked(db.task.delete).mockReturnValue(gate.promise)
    const props = reactive<AddEventFormProps>({
      show: true,
      initialData: { id: 'task-1', type: 'task', title: '写周报', time: '09:00', rawDuration: 0.5 }
    })
    const emit: AddEventFormEmit = vi.fn()

    const { handleDelete, isSubmitting } = useAddEventForm(props, emit)

    const first = handleDelete()
    const second = handleDelete()

    expect(isSubmitting.value).toBe(true)
    expect(db.task.delete).toHaveBeenCalledTimes(1)

    gate.resolve()
    await first
    await second

    expect(db.task.delete).toHaveBeenCalledTimes(1)
    expect(isSubmitting.value).toBe(false)
  })

  it('编辑目标任务时更新 goal_days 表而不是 task 表', async () => {
    const gate = deferred()
    vi.mocked(db.goalDays.update).mockReturnValue(gate.promise)
    const props = reactive<AddEventFormProps>({
      show: true,
      initialData: {
        id: 'goal-day-1',
        type: 'goal_day',
        title: '目标任务',
        time: '09:00',
        rawDuration: 0.5,
        description: '原描述'
      }
    })
    const emit: AddEventFormEmit = vi.fn()

    const { eventForm, submit } = useAddEventForm(props, emit)
    eventForm.title = '更新后的目标任务'
    eventForm.time = '10:15'
    eventForm.duration = 1
    eventForm.description = '新的描述'

    const pending = submit()

    expect(db.goalDays.update).toHaveBeenCalledTimes(1)
    expect(db.task.update).not.toHaveBeenCalled()
    expect(db.goalDays.update).toHaveBeenCalledWith('goal-day-1', {
      title: '更新后的目标任务',
      description: '新的描述',
      task_time: '10:15',
      duration: 60
    })

    gate.resolve({ id: 'goal-day-1', title: '更新后的目标任务' })
    await pending
  })

  it('删除目标任务时调用 goal_days.delete', async () => {
    const gate = deferred()
    vi.mocked(db.goalDays.delete).mockReturnValue(gate.promise)
    const props = reactive<AddEventFormProps>({
      show: true,
      initialData: {
        id: 'goal-day-1',
        type: 'goal_day',
        title: '目标任务',
        time: '09:00',
        rawDuration: 0.5
      }
    })
    const emit: AddEventFormEmit = vi.fn()

    const { handleDelete } = useAddEventForm(props, emit)
    const pending = handleDelete()

    expect(db.goalDays.delete).toHaveBeenCalledTimes(1)
    expect(db.task.delete).not.toHaveBeenCalled()

    gate.resolve()
    await pending
  })
})
