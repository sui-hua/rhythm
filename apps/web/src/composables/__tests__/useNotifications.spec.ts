import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { DailyScheduleItem } from '@/types/models'

vi.mock('@/utils/audio', () => ({
  playSuccessSound: vi.fn()
}))

// Test that the module exports the correct API without initializing Supabase
describe('useNotifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns notificationPermission, hasAskedPermission and requestPermission', async () => {
    // Mock Notification global
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    })
    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockResolvedValue({ scope: '/' })
      }
    })

    const { useNotifications } = await import('@/composables/useNotifications')
    const result = useNotifications()

    expect(result).toHaveProperty('notificationPermission')
    expect(result).toHaveProperty('hasAskedPermission')
    expect(result).toHaveProperty('requestPermission')
    expect(result).toHaveProperty('showNotification')
    expect(result).toHaveProperty('startListening')
    expect(result).toHaveProperty('stopListening')
    expect(result).toHaveProperty('clearNotifiedHistory')
    expect(result).toHaveProperty('getPermissionStatus')
  })

  it('hasAskedPermission defaults to false', async () => {
    vi.stubGlobal('Notification', { permission: 'default' })

    const { useNotifications } = await import('@/composables/useNotifications')
    const { hasAskedPermission } = useNotifications()

    expect(hasAskedPermission.value).toBe(false)
  })

  it('notifies scheduled task at midnight', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-12T00:00:00+08:00'))

    const notification = vi.fn(function (this: { onclick?: () => void }, _title: string, _options: NotificationOptions) {
      this.onclick = undefined
    }) as unknown as typeof Notification
    Object.defineProperty(notification, 'permission', { value: 'granted' })
    vi.stubGlobal('Notification', notification)

    const { useNotifications } = await import('@/composables/useNotifications')
    const { startListening, stopListening } = useNotifications()

    const items: DailyScheduleItem[] = [{
      id: 'task-midnight',
      sourceLabel: 'task',
      type: 'task',
      original: {
        id: 'task-midnight',
        title: '午夜任务',
        description: '',
        start_time: '2026-06-12T00:00:00+08:00',
        end_time: '2026-06-12T00:30:00+08:00',
        completed: false
      },
      startHour: 0,
      durationHours: 0.5,
      rawDuration: 0.5,
      time: '00:00',
      duration: '30分钟',
      category: '个人任务',
      title: '午夜任务',
      description: '',
      completed: false
    }]

    startListening(() => items)

    expect(notification).toHaveBeenCalledWith('任务开始: 午夜任务', expect.objectContaining({
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: 'task-task-midnight'
    }))

    stopListening()
  })

  it('matches date-only goal days against the local date', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-12T00:30:00+08:00'))

    const notification = vi.fn(function (this: { onclick?: () => void }, _title: string, _options: NotificationOptions) {
      this.onclick = undefined
    }) as unknown as typeof Notification
    Object.defineProperty(notification, 'permission', { value: 'granted' })
    vi.stubGlobal('Notification', notification)

    const { useNotifications } = await import('@/composables/useNotifications')
    const { startListening, stopListening } = useNotifications()

    const items: DailyScheduleItem[] = [{
      id: 'goal-day-local',
      sourceLabel: 'goal_day',
      type: 'goal_day',
      original: {
        id: 'goal-day-local',
        title: '凌晨计划',
        status: 'active',
        day: '2026-06-12',
        user_id: 'user-1',
        goal_month_id: 'month-1'
      },
      startHour: 0.5,
      durationHours: 0.5,
      rawDuration: 0.5,
      time: '00:30',
      duration: '30分钟',
      category: '今日计划',
      title: '凌晨计划',
      description: '',
      completed: false
    }]

    startListening(() => items)

    expect(notification).toHaveBeenCalledWith('任务开始: 凌晨计划', expect.objectContaining({
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: 'task-goal-day-local'
    }))

    stopListening()
  })

  it('notifies habits using the schedule item date', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-12T06:30:00+08:00'))

    const notification = vi.fn(function (this: { onclick?: () => void }, _title: string, _options: NotificationOptions) {
      this.onclick = undefined
    }) as unknown as typeof Notification
    Object.defineProperty(notification, 'permission', { value: 'granted' })
    vi.stubGlobal('Notification', notification)

    const { useNotifications } = await import('@/composables/useNotifications')
    const { startListening, stopListening } = useNotifications()

    const items = [{
      id: 'habit-morning',
      sourceLabel: 'habit',
      type: 'habit',
      scheduledDate: '2026-06-12',
      original: {
        id: 'habit-morning',
        title: '晨间拉伸',
        task_time: '06:30'
      },
      startHour: 6.5,
      durationHours: 0.5,
      rawDuration: 0.5,
      time: '06:30',
      duration: '30分钟',
      category: '日常习惯',
      title: '晨间拉伸',
      description: '',
      completed: false
    }] as DailyScheduleItem[]

    startListening(() => items)

    expect(notification).toHaveBeenCalledWith('习惯打卡: 晨间拉伸', expect.objectContaining({
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: 'task-habit-morning'
    }))

    stopListening()
  })

  it('registers the service worker when listening with an already granted permission', async () => {
    const notification = vi.fn() as unknown as typeof Notification
    Object.defineProperty(notification, 'permission', { value: 'granted' })
    vi.stubGlobal('Notification', notification)

    const register = vi.fn().mockResolvedValue({ scope: '/', active: { postMessage: vi.fn() } })
    vi.stubGlobal('navigator', {
      serviceWorker: { register }
    })

    const { useNotifications } = await import('@/composables/useNotifications')
    const { startListening, stopListening } = useNotifications()

    startListening(() => [])
    await Promise.resolve()

    expect(register).toHaveBeenCalledWith('/sw.js')

    stopListening()
  })
})
