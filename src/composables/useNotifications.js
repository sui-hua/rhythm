import { ref, onUnmounted } from 'vue'
import { playSuccessSound } from '@/utils/audio'

/**
 * 任务通知 Composable
 * 支持 Service Worker 后台通知，降级到页面内轮询
 */
const notifiedTaskIds = ref(new Set())
const notificationPermission = ref('default')
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

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.warn('浏览器不支持 Web Notification')
            return false
        }

        if (Notification.permission === 'granted') {
            notificationPermission.value = 'granted'
            // 注册 Service Worker
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

        // 如果有 Service Worker，发送任务列表并让它管理通知
        if (swRegistration) {
            // 立即同步一次任务列表
            const items = getScheduleItems()
            if (items && items.length > 0) {
                syncTasksToSw(items)
            }

            // 尝试注册 periodicsync（如果支持）
            if ('periodicSync' in swRegistration) {
                swRegistration.periodicSync.register('check-tasks', {
                    minInterval: 60000 // 1分钟
                }).catch(console.warn)
            }
        }

        // 降级方案：页面内每 30 秒检查一次
        checkInterval = setInterval(() => {
            if (notificationPermission.value !== 'granted') {
                return
            }

            const items = getScheduleItems()
            if (items && items.length > 0) {
                // 同时更新 Service Worker 的任务列表
                syncTasksToSw(items)
                checkAndNotify(items)
            }
        }, 30000)

        // 立即执行一次检查
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

        // 取消 periodicSync
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
        requestPermission,
        showNotification,
        startListening,
        stopListening,
        clearNotifiedHistory,
        getPermissionStatus
    }
}
