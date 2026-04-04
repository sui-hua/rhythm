import { ref, onUnmounted } from 'vue'
import { playSuccessSound } from '@/utils/audio'

/**
 * 任务通知 Composable
 * 负责管理 Web Notification API 和任务时间到达检测
 * 使用独立的定时器检测，不依赖番茄钟
 */
// 模块级状态 - 跨组件共享单例
const notifiedTaskIds = ref(new Set())
const notificationPermission = ref('default')
let checkInterval = null

export function useNotifications() {

    /**
     * 请求通知权限
     * @returns {Promise<boolean>} 是否获得授权
     */
    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.warn('浏览器不支持 Web Notification')
            return false
        }

        if (Notification.permission === 'granted') {
            notificationPermission.value = 'granted'
            return true
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission()
            notificationPermission.value = permission
            return permission === 'granted'
        }

        return false
    }

    /**
     * 获取当前权限状态
     * @returns {string} 权限状态: 'granted' | 'denied' | 'default' | 'unsupported'
     */
    const getPermissionStatus = () => {
        if (!('Notification' in window)) return 'unsupported'
        return Notification.permission
    }

    /**
     * 显示系统通知
     * @param {string} title - 通知标题
     * @param {object} options - 通知选项
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
     * 检查任务时间并触发通知
     * @param {Array} items - 日程项目列表 (dailySchedule)
     */
    const checkAndNotify = (items) => {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentDateStr = now.toISOString().split('T')[0]

        items.forEach(item => {
            // 没有开始时间或已通知过的项目跳过
            if (!item.startHour || notifiedTaskIds.value.has(item.id)) {
                return
            }

            const [hours, minutes] = item.time.split(':').map(Number)

            // 获取项目日期字符串
            let itemDateStr
            if (item.original?.day) {
                itemDateStr = new Date(item.original.day).toISOString().split('T')[0]
            } else if (item.original?.start_time) {
                itemDateStr = new Date(item.original.start_time).toISOString().split('T')[0]
            } else {
                return
            }

            // 检查是否是同一天的同一分钟
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
     * 启动通知监听（独立的定时器，不依赖番茄钟）
     * @param {Function} getScheduleItems - 返回当前日程项的函数
     */
    const startListening = (getScheduleItems) => {
        // 清除已有的定时器
        stopListening()

        // 每分钟检测一次任务时间
        checkInterval = setInterval(() => {
            if (notificationPermission.value !== 'granted') {
                return
            }

            const items = getScheduleItems()
            if (items && items.length > 0) {
                checkAndNotify(items)
            }
        }, 30000) // 每30秒检查一次

        // 立即执行一次检查
        if (notificationPermission.value === 'granted') {
            const items = getScheduleItems()
            if (items && items.length > 0) {
                checkAndNotify(items)
            }
        }
    }

    /**
     * 停止通知监听
     */
    const stopListening = () => {
        if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
        }
    }

    /**
     * 清除已通知记录（日期切换时调用）
     */
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
