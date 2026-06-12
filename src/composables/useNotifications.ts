import { ref, onUnmounted, type Ref } from 'vue'
import { playSuccessSound } from '@/utils/audio'
import type { DailyScheduleItem } from '@/types/models'

// 通知序列化使用的原始数据形状（从 DailyScheduleItem.original 提取日期字段）
interface ScheduleOriginal {
  day?: string
  start_time?: string
}

interface SerializedTask {
  id: string
  completed: boolean
  time: string
  type: string
  title: string
  description?: string
  startHour?: number
  originalDay?: string | null
  originalStartTime?: string | null
}

interface PeriodicSyncManager {
  register: (tag: string, options?: { minInterval?: number }) => Promise<void>
  unregister: (tag: string) => Promise<void>
}

interface ServiceWorkerRegistrationWithPeriodicSync extends ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager
}

let checkInterval: ReturnType<typeof setInterval> | null = null
let swRegistration: ServiceWorkerRegistration | null = null

// 浏览器实验 API 的类型守卫，避免把动态字段扩散到业务逻辑中
const getPeriodicSync = (registration: ServiceWorkerRegistration): PeriodicSyncManager | null => {
  const candidate = registration as ServiceWorkerRegistrationWithPeriodicSync
  return candidate.periodicSync ?? null
}

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration.scope)
    return registration
  } catch (e) {
    console.error('Service Worker registration failed:', e)
    return null
  }
}

// 从日程列表中提取 Service Worker 需要的可序列化字段
const serializeTasksForSw = (items: DailyScheduleItem[]): SerializedTask[] => {
  return items.map(item => ({
    id: item.id,
    completed: item.completed,
    time: item.time,
    type: item.type,
    title: item.title,
    description: item.description,
    startHour: item.startHour,
    // 只提取 original 中 Service Worker 需要的日期字段，避免传递整个 reactive proxy 对象
    originalDay: (item.original as ScheduleOriginal)?.day || null,
    originalStartTime: (item.original as ScheduleOriginal)?.start_time || null
  }))
}

const syncTasksToSw = (items: DailyScheduleItem[]): void => {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({
      type: 'UPDATE_TASKS',
      tasks: serializeTasksForSw(items)
    })
  }
}

const triggerSwCheck = (): void => {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({
      type: 'CHECK_NOTIFICATIONS'
    })
  }
}

interface ShowNotificationOptions {
  tag?: string
  icon?: string
  badge?: string
  body?: string
}

interface UseNotificationsReturn {
  notificationPermission: Ref<string>
  hasAskedPermission: Ref<boolean>
  requestPermission: () => Promise<boolean>
  showNotification: (title: string, options?: ShowNotificationOptions) => void
  startListening: (getScheduleItems: () => DailyScheduleItem[]) => void
  stopListening: () => void
  clearNotifiedHistory: () => void
  getPermissionStatus: () => string
}

export function useNotifications(): UseNotificationsReturn {
  // 每次调用创建独立实例，避免多组件共享同一份通知历史
  const notifiedTaskIds = ref(new Set<string>())
  const hasAskedPermission = ref(false)
  const notificationPermission = ref(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  )

  const requestPermission = async (): Promise<boolean> => {
    hasAskedPermission.value = true
    if (!('Notification' in window)) {
      console.warn('浏览器不支持 Web Notification')
      return false
    }

    if (Notification.permission === 'granted') {
      notificationPermission.value = 'granted'
      swRegistration = await registerServiceWorker()
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      notificationPermission.value = permission
      if (permission === 'granted') {
        swRegistration = await registerServiceWorker()
      }
      return permission === 'granted'
    }

    return false
  }

  const getPermissionStatus = (): string => {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission
  }

  const showNotification = (title: string, options: ShowNotificationOptions = {}): void => {
    if (notificationPermission.value !== 'granted') {
      return
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || 'task-notification',
      ...options
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  const checkAndNotify = (items: DailyScheduleItem[]): void => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentDateStr = now.toISOString().split('T')[0]

    items.forEach(item => {
      if (!item.startHour || notifiedTaskIds.value.has(item.id)) {
        return
      }

      const [hours, minutes] = item.time.split(':').map(Number)

      const original = item.original as ScheduleOriginal
      let itemDateStr: string | undefined
      if (original?.day) {
        itemDateStr = new Date(original.day).toISOString().split('T')[0]
      } else if (original?.start_time) {
        itemDateStr = new Date(original.start_time).toISOString().split('T')[0]
      } else {
        return
      }

      // 精确到分钟的匹配
      if (itemDateStr === currentDateStr &&
        hours === currentHour &&
        minutes === currentMinute) {

        const title = item.type === 'habit'
          ? `习惯打卡: ${item.title}`
          : `任务开始: ${item.title}`

        showNotification(title, {
          tag: `task-${item.id}`,
          body: item.description || '点击查看详情'
        })

        notifiedTaskIds.value.add(item.id)
        playSuccessSound()
      }
    })
  }

  // 重入保护：已有轮询则跳过
  const startListening = (getScheduleItems: () => DailyScheduleItem[]): void => {
    if (checkInterval) return

    stopListening()

    if (swRegistration) {
      const items = getScheduleItems()
      if (items && items.length > 0) {
        syncTasksToSw(items)
      }

      const periodicSync = getPeriodicSync(swRegistration)
      if (periodicSync) {
        periodicSync.register('check-tasks', {
          minInterval: 60000
        }).catch(console.warn)
      }
    }

    // 记录上次检查的分钟数，避免同一分钟内重复检查
    let lastCheckedMinute = -1

    checkInterval = setInterval(() => {
      if (notificationPermission.value !== 'granted') {
        return
      }

      // 同一分钟内只检查一次，减少不必要的网络请求和计算
      const now = new Date()
      const currentMinute = now.getHours() * 60 + now.getMinutes()
      if (currentMinute === lastCheckedMinute) return
      lastCheckedMinute = currentMinute

      const items = getScheduleItems()
      if (items && items.length > 0) {
        syncTasksToSw(items)
        checkAndNotify(items)
      }
    }, 60000)

    if (notificationPermission.value === 'granted') {
      const items = getScheduleItems()
      if (items && items.length > 0) {
        syncTasksToSw(items)
        checkAndNotify(items)
      }
    }
  }

  const stopListening = (): void => {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }

    if (swRegistration) {
      getPeriodicSync(swRegistration)?.unregister('check-tasks').catch(console.warn)
    }
  }

  // 清空当前实例的通知历史
  const clearNotifiedHistory = (): void => {
    notifiedTaskIds.value.clear()
  }

  onUnmounted(() => {
    stopListening()
  })

  return {
    notificationPermission,
    hasAskedPermission,
    requestPermission,
    showNotification,
    startListening,
    stopListening,
    clearNotifiedHistory,
    getPermissionStatus
  }
}
