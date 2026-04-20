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
 *
 * 【技术方案】
 * - 优先使用 Service Worker + Periodic Background Sync 实现后台检查
 * - 降级方案：页面活跃时每 30 秒轮询一次
 * - 已通知的任务 ID 存入 Set，防止重复通知
 *
 * @module composables/useNotifications
 * @author Rhythm Team
 * @version 1.0.0
 */
import { ref, onUnmounted } from 'vue'
import { playSuccessSound } from '@/utils/audio'

/**
 * 任务通知 Composable
 * 支持 Service Worker 后台通知，降级到页面内轮询
 *
 * @module useNotifications
 * @description 提供通知权限管理、任务检查与提醒功能
 * @returns {Object} 通知相关的方法与状态
 */
const notifiedTaskIds = ref(new Set())
let checkInterval = null
let swRegistration = null

// 尝试注册 Service Worker
/**
 * 注册 Service Worker 用于后台通知
 * @async
 * @function registerServiceWorker
 * @returns {Promise<ServiceWorkerRegistration|null>} 注册成功返回 Registration 对象，否则返回 null
 */
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
/**
 * 将任务列表同步到 Service Worker
 * @function syncTasksToSw
 * @param {Array} items - 任务/习惯项目列表
 * @returns {void}
 */
const syncTasksToSw = (items) => {
    if (swRegistration?.active) {
        swRegistration.active.postMessage({
            type: 'UPDATE_TASKS',
            tasks: items
        })
    }
}

// 触发 Service Worker 检查通知
/**
 * 主动触发 Service Worker 执行通知检查
 * @function triggerSwCheck
 * @returns {void}
 */
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

    /**
     * 请求通知权限
     * @async
     * @function requestPermission
     * @returns {Promise<boolean>} 授权成功返回 true，否则返回 false
     */
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

    /**
     * 获取当前通知权限状态
     * @function getPermissionStatus
     * @returns {string} 'granted' | 'denied' | 'default' | 'unsupported'
     */
    const getPermissionStatus = () => {
        if (!('Notification' in window)) return 'unsupported'
        return Notification.permission
    }

    /**
     * 显示浏览器通知
     * @function showNotification
     * @param {string} title - 通知标题
     * @param {Object} [options={}] - 通知选项
     * @param {string} [options.tag='task-notification'] - 通知标签，用于分组
     * @param {string} [options.body] - 通知正文
     * @returns {void}
     */
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

    /**
     * 检查任务时间并发送通知
     * @function checkAndNotify
     * @param {Array} items - 任务/习惯列表
     * @returns {void}
     * @description 精确到分钟匹配当前时间与任务时间，匹配成功则发送通知并播放提示音
     */
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

    /**
     * 启动通知监听
     * @function startListening
     * @param {Function} getScheduleItems - 获取任务列表的回调函数
     * @returns {void}
     * @description 初始化 Service Worker 并开始 30 秒轮询，组件卸载时自动停止
     */
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

    /**
     * 停止通知监听
     * @function stopListening
     * @returns {void}
     * @description 清除轮询定时器并注销 Periodic Background Sync
     */
    const stopListening = () => {
        if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
        }

        if (swRegistration?.periodicSync) {
            swRegistration.periodicSync.unregister('check-tasks').catch(console.warn)
        }
    }

    /**
     * 清除已通知历史记录
     * @function clearNotifiedHistory
     * @returns {void}
     * @description 清空已通知任务 ID 集合，允许任务重新触发通知
     */
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
