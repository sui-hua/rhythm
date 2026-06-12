import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// mock onScopeDispose，避免在非组件上下文中报错
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    onScopeDispose: vi.fn()
  }
})

import { usePomodoroStore } from '@/stores/pomodoroStore'

describe('pomodoroStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('初始状态 activeTask=null, showModal=false', () => {
    const store = usePomodoroStore()
    expect(store.activeTask).toBeNull()
    expect(store.showModal).toBe(false)
  })

  it('setActiveTask → activeTask 被设置, showModal=true, timer 启动', () => {
    const store = usePomodoroStore()
    const task = {
      id: 'task-1',
      title: '测试任务',
      type: 'task' as const,
      completed: false,
      start_time: '2026-06-05T10:00:00Z',
      end_time: '2026-06-05T11:00:00Z',
      actual_start_time: '2026-06-05T10:00:00Z',
      actual_end_time: null
    }

    store.setActiveTask(task)

    expect(store.activeTask).toEqual(task)
    expect(store.showModal).toBe(true)
    expect(store.elapsedSeconds).toBeGreaterThanOrEqual(0)
  })

  it('reset → 全部重置', () => {
    const store = usePomodoroStore()
    const task = {
      id: 'task-1',
      title: '测试任务',
      type: 'task' as const,
      completed: false,
      start_time: '2026-06-05T10:00:00Z',
      end_time: '2026-06-05T11:00:00Z',
      actual_start_time: '2026-06-05T10:00:00Z',
      actual_end_time: null
    }
    store.setActiveTask(task)
    expect(store.activeTask).not.toBeNull()

    store.reset()

    expect(store.activeTask).toBeNull()
    expect(store.showModal).toBe(false)
  })

  it('closeModal → showModal=false', () => {
    const store = usePomodoroStore()
    const task = {
      id: 'task-1',
      title: '测试任务',
      type: 'task' as const,
      completed: false,
      start_time: '2026-06-05T10:00:00Z',
      end_time: '2026-06-05T11:00:00Z',
      actual_start_time: '2026-06-05T10:00:00Z',
      actual_end_time: null
    }
    store.setActiveTask(task)
    expect(store.showModal).toBe(true)

    store.closeModal()
    expect(store.showModal).toBe(false)
    expect(store.activeTask).not.toBeNull()
  })

  it('openModal 当 activeTask 存在 → showModal=true', () => {
    const store = usePomodoroStore()
    const task = {
      id: 'task-1',
      title: '测试任务',
      type: 'task' as const,
      completed: false,
      start_time: '2026-06-05T10:00:00Z',
      end_time: '2026-06-05T11:00:00Z',
      actual_start_time: '2026-06-05T10:00:00Z',
      actual_end_time: null
    }
    store.setActiveTask(task)
    store.closeModal()
    expect(store.showModal).toBe(false)

    store.openModal()
    expect(store.showModal).toBe(true)
  })

  it('openModal 当 activeTask 为 null → showModal 不变', () => {
    const store = usePomodoroStore()
    expect(store.activeTask).toBeNull()
    expect(store.showModal).toBe(false)

    store.openModal()
    expect(store.showModal).toBe(false)
  })

  it('elapsedSeconds 和 formattedTime 计算正确', () => {
    const fixedNow = new Date('2026-06-05T10:00:00Z').getTime()
    vi.setSystemTime(fixedNow)

    const store = usePomodoroStore()
    const startTime = new Date(fixedNow - 3661 * 1000).toISOString()
    const task = {
      id: 'task-1',
      title: '测试任务',
      type: 'task' as const,
      completed: false,
      start_time: startTime,
      end_time: null,
      actual_start_time: startTime,
      actual_end_time: null
    }

    store.setActiveTask(task)
    vi.advanceTimersByTime(1000)

    expect(store.elapsedSeconds).toBeGreaterThanOrEqual(3661)
    expect(store.formattedTime).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    expect(store.formattedTime).toBe('01:01:02')
  })

  it('无 activeTask 时 elapsedSeconds=0, formattedTime=00:00', () => {
    const store = usePomodoroStore()
    expect(store.elapsedSeconds).toBe(0)
    expect(store.formattedTime).toBe('00:00')
  })
})
