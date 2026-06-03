import { ref, onUnmounted } from 'vue'
import { playSuccessSound } from '@/utils/audio'

// 全局单例：所有组件共享同一份通知历史，clearNotifiedHistory() 会清空全部
const notifiedTaskIds = ref(new Set())
let checkInterval = null
let swRegistration = null

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

const syncTasksToSw = (items) => {
    if (swRegistration?.active) {
        swRegistration.active.postMessage({
            type: 'UPDATE_TASKS',
            tasks: items
        })
    }
}

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

    // 重入保护：已有轮询则跳过
    const startListening = (getScheduleItems) => {
        if (checkInterval) return

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

    // 注意：此操作影响全局，所有组件共享的通知历史都会被清空
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
