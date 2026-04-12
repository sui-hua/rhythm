// public/sw.js
// Service Worker for minute-precise task notifications

const CACHE_NAME = 'rhythm-notifications-v1'
const DB_NAME = 'rhythm-tasks-db'
const STORE_NAME = 'tasks'

// 初始化 IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
        request.onupgradeneeded = (e) => {
            const db = e.target.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
    })
}

// 保存任务到 IndexedDB
async function saveTasks(tasks) {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    // 清空旧数据
    store.clear()

    // 添加新任务
    for (const task of tasks) {
        if (task.startHour !== undefined) {
            store.add(task)
        }
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

// 获取当天任务
async function getTasks() {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

// 检查并发送通知
async function checkAndNotify() {
    const tasks = await getTasks()
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentDateStr = now.toISOString().split('T')[0]

    for (const task of tasks) {
        // 跳过已完成的任务
        if (task.completed) continue

        // 解析任务时间
        const [hours, minutes] = (task.time || '').split(':').map(Number)
        if (isNaN(hours) || isNaN(minutes)) continue

        // 获取任务日期
        let itemDateStr
        if (task.original?.day) {
            itemDateStr = new Date(task.original.day).toISOString().split('T')[0]
        } else if (task.original?.start_time) {
            itemDateStr = new Date(task.original.start_time).toISOString().split('T')[0]
        } else {
            continue
        }

        // 精确匹配小时和分钟
        if (itemDateStr === currentDateStr &&
            hours === currentHour &&
            minutes === currentMinute) {

            const title = task.type === 'habit'
                ? `习惯打卡: ${task.title}`
                : `任务开始: ${task.title}`

            // 发送通知
            self.registration.showNotification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `task-${task.id}`,
                body: task.description || '点击查看详情',
                requireInteraction: false
            })

            // 从数据库移除已通知的任务（避免重复通知）
            const db = await openDB()
            const tx = db.transaction(STORE_NAME, 'readwrite')
            tx.objectStore(STORE_NAME).delete(task.id)
        }
    }
}

// 监听安装事件
self.addEventListener('install', (e) => {
    e.waitUntil(self.skipWaiting())
})

// 监听激活事件
self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim())
})

// 监听消息事件
self.addEventListener('message', (e) => {
    if (e.data.type === 'UPDATE_TASKS') {
        saveTasks(e.data.tasks)
    } else if (e.data.type === 'CHECK_NOTIFICATIONS') {
        checkAndNotify()
    }
})

// 监听通知点击
self.addEventListener('notificationclick', (e) => {
    e.notification.close()
    e.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // 如果有已打开的窗口，聚焦它
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus()
                }
            }
            // 否则打开新窗口
            if (clients.openWindow) {
                return clients.openWindow('/day')
            }
        })
    )
})

// 每分钟定时检查（Service Worker 唤醒时）
self.addEventListener('periodicsync', (e) => {
    if (e.tag === 'check-tasks') {
        e.waitUntil(checkAndNotify())
    }
})
