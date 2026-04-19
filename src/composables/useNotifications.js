/**
 * ============================================
 * 任务通知Composable (composables/useNotifications.js)
 * ============================================
 *
 * 【模块职责】
 * - 任务/习惯打卡时间到了发送通知
 * - 支持 Service Worker 后台通知
 * - 降级到页面内每 30 秒轮询检查
 *
 * 【通知触发条件】
 * - 浏览器已授权通知权限
 * - 任务/习惯设定了具体时间
 * - 当前时间精确到分钟匹配任务时间
 */
import { ref, onUnmounted } from 'vue'
import { playSuccessSound } from '@/utils/audio'

/**
 * 任务通知 Composable
 * 支持 Service Worker 后台通知，降级到页面内轮询
 */
const notifiedTaskIds = ref(new Set())
let checkInterval = null
let swRegistration = null

// 尝试注册 Service Worker
const registerServiceWorker = async () => {
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

// 发送任务列表到 Service Worker
const syncTasksToSw = (items) => {
    if (swRegistration?.active) {
        swRegistration.active.postMessage({
            type: 'UPDATE_TASKS',
            tasks: items
        })
    }
}

// 触发 Service Worker 检查通知
const triggerSwCheck = () => {
    if (swRegistration?.active) {
        swRegistration.active.postMessage({
            type: 'CHECK_NOTIFICATIONS'
        })
    }
}

export function useNotifications() {
    const hasAskedPermission = ref(false)
    const notificationPermission = ref(
        typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
    )

    const requestPermission = async () => {
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

    const getPermissionStatus = () => {
        if (!('Notification' in window)) return 'unsupported'
        return Notification.permission
    }

    const showNotification = (title, options = {}) => {
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

    const checkAndNotify = (items) => {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentDateStr = now.toISOString().split('T')[0]

        items.forEach(item => {
            if (!item.startHour || notifiedTaskIds.value.has(item.id)) {
                return
            }

            const [hours, minutes] = item.time.split(':').map(Number)

            let itemDateStr
            if (item.original?.day) {
                itemDateStr = new Date(item.original.day).toISOString().split('T')[0]
            } else if (item.original?.start_time) {
                itemDateStr = new Date(item.original.start_time).toISOString().split('T')[0]
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

    const startListening = (getScheduleItems) => {
        stopListening()

        if (swRegistration) {
            const items = getScheduleItems()
            if (items && items.length > 0) {
                syncTasksToSw(items)
            }

            if ('periodicSync' in swRegistration) {
                swRegistration.periodicSync.register('check-tasks', {
                    minInterval: 60000
                }).catch(console.warn)
            }
        }

        checkInterval = setInterval(() => {
            if (notificationPermission.value !== 'granted') {
                return
            }

            const items = getScheduleItems()
            if (items && items.length > 0) {
                syncTasksToSw(items)
                checkAndNotify(items)
            }
        }, 30000)

        if (notificationPermission.value === 'granted') {
            const items = getScheduleItems()
            if (items && items.length > 0) {
                syncTasksToSw(items)
                checkAndNotify(items)
            }
        }
    }

    const stopListening = () => {
        if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
        }

        if (swRegistration?.periodicSync) {
            swRegistration.periodicSync.unregister('check-tasks').catch(console.warn)
        }
    }

    const clearNotifiedHistory = () => {
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
