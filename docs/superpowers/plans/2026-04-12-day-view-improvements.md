# Day 视图改进实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现三项 Day 视图改进：快速添加模式、移动端左滑完成、精确到分钟通知

**Architecture:**
- 快速添加：新增 `QuickAddDrawer.vue` 组件，基于现有 `MobileAddEventDrawer` 简化
- 左滑完成：新增 `useSwipeToComplete` composable，在 Sidebar 任务列表启用
- 精确通知：新增 `sw.js` Service Worker，重构 `useNotifications` 支持分钟级触发

**Tech Stack:** Vue 3 Composition API, Touch Events API, Service Worker, Notification API

---

## 文件结构

```
src/
├── views/day/
│   ├── components/
│   │   ├── QuickAddDrawer.vue          # [新建] 快速添加抽屉组件
│   │   └── Sidebar.vue                 # [修改] 集成左滑完成
│   └── composables/
│       └── useSwipeToComplete.js       # [新建] 左滑完成逻辑
├── composables/
│   └── useNotifications.js             # [修改] 支持 Service Worker
├── services/
│   └── sw.js                           # [新建] Service Worker 脚本
└── main.js                             # [修改] 注册 Service Worker
```

---

## Part 1: 快速添加模式

### Task 1: 创建 useQuickAddForm Composable

**Files:**
- Create: `src/views/day/composables/useQuickAddForm.js`

- [ ] **Step 1: 创建 composable 文件**

```javascript
// src/views/day/composables/useQuickAddForm.js
import { ref, reactive, watch } from 'vue'
import { safeDb as db } from '@/services/safeDb'
import { useAuthStore } from '@/stores/authStore'
import { useDateStore } from '@/stores/dateStore'
import { useDayData } from './useDayData'
import { withLoadingLock } from '@/utils/throttle'

/**
 * 快速添加表单逻辑 (Composable)
 * 仅需标题，其他字段全部默认
 */
export function useQuickAddForm(props, emit) {
    const authStore = useAuthStore()
    const dateStore = useDateStore()
    const { fetchTasks } = useDayData()

    // 记录上次使用的时间（用于连续快速添加）
    const lastUsedTime = ref('08:00')
    const lastUsedDuration = ref(0.5)

    const form = reactive({
        title: '',
        time: '',
        duration: 0.5,
        category: '工作',
        description: ''
    })

    // 监听显示状态，重置表单
    watch(() => props.show, (newShow) => {
        if (newShow) {
            form.title = ''
            form.time = lastUsedTime.value
            form.duration = lastUsedDuration.value
            form.category = '工作'
            form.description = ''
        }
    }, { immediate: true })

    // 快速创建任务
    const quickSubmit = withLoadingLock(async () => {
        if (!form.title) return false

        const [hours, minutes] = form.time.split(':').map(Number)
        const durationValue = parseFloat(form.duration)

        try {
            const userId = authStore.userId
            if (!userId) {
                console.error('User not authenticated')
                return false
            }

            const year = dateStore.currentDate.getFullYear()
            const month = dateStore.currentDate.getMonth()
            const day = dateStore.currentDate.getDate()
            const startTime = new Date(year, month, day, hours, minutes)
            const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000)

            await db.tasks.create({
                user_id: userId,
                title: form.title,
                description: form.description,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                completed: false,
            })

            // 保存本次使用的时间和时长
            lastUsedTime.value = form.time
            lastUsedDuration.value = durationValue

            await fetchTasks({ showLoading: false })
            return true
        } catch (e) {
            console.error('Failed to quick add task', e)
            return false
        }
    })

    return {
        form,
        quickSubmit
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/views/day/composables/useQuickAddForm.js
git commit -m "feat(day): add useQuickAddForm composable for quick task creation"
```

---

### Task 2: 创建 QuickAddDrawer 组件

**Files:**
- Create: `src/views/day/components/QuickAddDrawer.vue`

- [ ] **Step 1: 创建快速添加抽屉组件**

```vue
<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div
      v-if="show"
      class="fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px]"
      @click="handleClose"
    ></div>

    <!-- 抽屉容器 -->
    <div
      class="fixed bottom-0 left-0 right-0 z-101 bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe"
      :class="show ? 'translate-y-0' : 'translate-y-full'"
      style="max-height: 50vh;"
    >
      <!-- 顶部拉手区域 -->
      <div class="py-4 flex justify-center shrink-0 cursor-pointer" @click="handleClose">
        <div class="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
      </div>

      <div class="flex flex-col flex-1 overflow-hidden px-7 pb-10">
        <header class="text-left mb-6 shrink-0">
          <h2 class="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-100 mb-1">
            Quick Add
          </h2>
          <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            快速添加任务
          </p>
        </header>

        <div class="flex-1 overflow-y-auto mb-6">
          <div class="flex flex-col gap-5">
            <!-- 任务名称 - 唯一必填项 -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">项目名称</label>
              <input
                ref="titleInput"
                v-model="form.title"
                type="text"
                class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-4 text-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="输入任务名称，回车快速创建"
                @keydown.enter="handleQuickSubmit"
              />
            </div>

            <!-- 默认值预览 -->
            <div class="flex items-center gap-4 text-sm text-zinc-400">
              <span class="flex items-center gap-1">
                <Clock class="w-4 h-4" />
                {{ form.time }}
              </span>
              <span>·</span>
              <span>{{ form.duration }}小时</span>
              <span>·</span>
              <span>{{ form.category }}</span>
            </div>

            <!-- 更多选项按钮 -->
            <button
              @click="$emit('switch-to-full')"
              class="text-xs text-primary hover:underline underline-offset-4 text-left"
            >
              + 更多选项（完整模式）
            </button>
          </div>
        </div>

        <footer class="shrink-0">
          <button
            @click="handleQuickSubmit"
            :disabled="!form.title"
            class="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/10 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            快速创建
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Clock } from 'lucide-vue-next'
import { useQuickAddForm } from '@/views/day/composables/useQuickAddForm'

const props = defineProps({
  show: Boolean,
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:show', 'switch-to-full'])

const { form, quickSubmit } = useQuickAddForm(props, emit)
const titleInput = ref(null)

// 自动聚焦标题输入框
watch(() => props.show, async (newShow) => {
  if (newShow) {
    await nextTick()
    titleInput.value?.focus()
  }
})

const handleQuickSubmit = async () => {
  const success = await quickSubmit()
  if (success) {
    emit('update:show', false)
  }
}

const handleClose = () => {
  emit('update:show', false)
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/day/components/QuickAddDrawer.vue
git commit -m "feat(day): add QuickAddDrawer component for fast task creation"
```

---

### Task 3: 集成 QuickAddDrawer 到 Day 视图

**Files:**
- Modify: `src/views/day/index.vue:43-53`

- [ ] **Step 1: 在 Day 视图中导入并使用 QuickAddDrawer**

在 `AddEventModal` 和 `MobileAddEventDrawer` 之后添加：

```vue
<!-- Quick Add Drawer (移动端快速添加) -->
<QuickAddDrawer
  v-if="isMobile"
  v-model:show="showQuickAdd"
  @switch-to-full="openFullAddModal"
/>
```

- [ ] **Step 2: 添加 showQuickAdd 状态和相关方法**

在 `useDayModal()` 调用后添加：

```javascript
const showQuickAdd = ref(false)

// 移动端快速添加
const openQuickAdd = () => {
  showQuickAdd.value = true
}

const openFullAddModal = () => {
  showQuickAdd.value = false
  openAddModal()
}
```

- [ ] **Step 3: 修改移动端 FAB 按钮点击事件**

将 `@click="showSidebar = !showSidebar"` 改为先检查是否在添加模式，或者添加新的快速添加入口。

- [ ] **Step 4: 提交**

```bash
git add src/views/day/index.vue
git commit -m "feat(day): integrate QuickAddDrawer into Day view"
```

---

## Part 2: 移动端左滑完成任务

### Task 4: 创建 useSwipeToComplete Composable

**Files:**
- Create: `src/views/day/composables/useSwipeToComplete.js`

- [ ] **Step 1: 创建左滑完成逻辑**

```javascript
// src/views/day/composables/useSwipeToComplete.js
import { ref } from 'vue'
import { playSuccessSound } from '@/utils/audio'

/**
 * 左滑完成任务 Composable
 * @param {Function} onComplete - 完成回调
 */
export function useSwipeToComplete(onComplete) {
    const SWIPE_THRESHOLD = 0.5 // 50% 宽度触发完成
    const MAX_SWIPE = 80 // 最大滑动距离(px)

    const swipeState = ref({
        isSwiping: false,
        offsetX: 0,
        startX: 0
    })

    const handleTouchStart = (e) => {
        swipeState.value.startX = e.touches[0].clientX
        swipeState.value.isSwiping = true
        swipeState.value.offsetX = 0
    }

    const handleTouchMove = (e) => {
        if (!swipeState.value.isSwiping) return

        const currentX = e.touches[0].clientX
        let deltaX = swipeState.value.startX - currentX

        // 只响应左滑（deltaX > 0）
        if (deltaX < 0) {
            deltaX = 0
        } else {
            // 限制最大滑动距离
            deltaX = Math.min(deltaX, MAX_SWIPE)
        }

        swipeState.value.offsetX = deltaX
    }

    const handleTouchEnd = async () => {
        if (!swipeState.value.isSwiping) return

        const { offsetX, startX } = swipeState.value
        const elementWidth = 280 // 预估侧边栏宽度，实际使用时可通过参数传入
        const ratio = offsetX / elementWidth

        swipeState.value.isSwiping = false

        // 超过阈值，触发完成
        if (ratio >= SWIPE_THRESHOLD) {
            // 震动反馈
            if ('vibrate' in navigator) {
                navigator.vibrate(50)
            }

            // 播放成功音效
            playSuccessSound()

            // 执行完成回调
            if (onComplete) {
                await onComplete()
            }
        }

        // 重置状态
        setTimeout(() => {
            swipeState.value.offsetX = 0
        }, 300)
    }

    const resetSwipe = () => {
        swipeState.value.offsetX = 0
        swipeState.value.isSwiping = false
    }

    return {
        swipeState,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        resetSwipe
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/views/day/composables/useSwipeToComplete.js
git commit -m "feat(day): add useSwipeToComplete composable"
```

---

### Task 5: 在 Sidebar 任务列表启用左滑完成

**Files:**
- Modify: `src/views/day/components/Sidebar.vue:46-79`

- [ ] **Step 1: 导入并使用 useSwipeToComplete**

```javascript
import { useSwipeToComplete } from '@/views/day/composables/useSwipeToComplete'
```

- [ ] **Step 2: 在组件 setup 中集成**

```javascript
const { handleToggleComplete } = useDayData()
const { handleTouchStart, handleTouchMove, handleTouchEnd, swipeState } = useSwipeToComplete(
    () => handleToggleComplete(item)
)

// 暴露给模板
defineExpose({
    swipeState
})
```

- [ ] **Step 3: 修改任务项模板，添加左滑交互**

在现有的任务项 div 上添加 touch 事件和滑动样式：

```vue
<div
  @click="$emit('scrollToTask', index)"
  @dblclick="$emit('edit-task', index)"
  @touchstart="handleTouchStart"
  @touchmove="handleTouchMove"
  @touchend="handleTouchEnd"
  class="flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer group relative overflow-hidden"
  :class="item.completed ? 'opacity-50' : 'hover:bg-zinc-50'"
  :style="{ transform: `translateX(-${swipeState.offsetX}px)`, transition: swipeState.isSwiping ? 'none' : 'transform 0.3s ease' }"
>
  <!-- 左滑显示的完成按钮区域 -->
  <div
    v-if="swipeState.offsetX > 0"
    class="absolute left-0 top-0 bottom-0 w-full bg-green-500 flex items-center justify-end pr-4"
    :style="{ width: `${swipeState.offsetX}px` }"
  >
    <Check class="w-5 h-5 text-white" />
  </div>

  <!-- 原任务内容 -->
  ...
</div>
```

- [ ] **Step 4: 提交**

```bash
git add src/views/day/components/Sidebar.vue
git commit -m "feat(day): enable swipe-to-complete on mobile task items"
```

---

## Part 3: 精确到分钟通知（Service Worker）

### Task 6: 创建 Service Worker 文件

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: 创建 Service Worker 脚本**

```javascript
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
```

- [ ] **Step 2: 提交**

```bash
git add public/sw.js
git commit -m "feat(notification): add Service Worker for minute-precise notifications"
```

---

### Task 7: 重构 useNotifications 支持 Service Worker

**Files:**
- Modify: `src/composables/useNotifications.js`

- [ ] **Step 1: 重构 useNotifications，添加 Service Worker 支持**

```javascript
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
```

- [ ] **Step 2: 提交**

```bash
git add src/composables/useNotifications.js
git commit -m "feat(notification): refactor useNotifications to support Service Worker"
```

---

## 实施检查清单

- [ ] Task 1: useQuickAddForm composable 创建完成
- [ ] Task 2: QuickAddDrawer 组件创建完成
- [ ] Task 3: Day 视图集成快速添加完成
- [ ] Task 4: useSwipeToComplete composable 创建完成
- [ ] Task 5: Sidebar 左滑完成集成完成
- [ ] Task 6: Service Worker 创建完成
- [ ] Task 7: useNotifications 重构完成

---

## 测试验证

完成实现后，按以下步骤测试：

### 快速添加模式
```bash
# 1. 启动开发服务器
pnpm dev

# 2. 移动端 viewport 打开 /day
# 3. 点击右下角 + 按钮
# 4. 只输入标题，回车
# 5. 验证任务创建成功，列表刷新
```

### 左滑完成
```bash
# 1. 移动端 viewport 打开 /day
# 2. 在侧边栏找到任务列表
# 3. 左滑任务项
# 4. 验证滑动超过 50% 自动完成
```

### 精确通知
```bash
# 1. 创建一个 10:30 的任务
# 2. 等待系统时间到达 10:30
# 3. 验证收到系统通知
```
