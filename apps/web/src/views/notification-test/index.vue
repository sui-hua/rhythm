<template>
  <!--
    NotificationTest 页面 — 手动诊断浏览器通知链路
    主要结构：状态面板、操作按钮、图标预览、运行日志
  -->
  <div class="min-h-screen overflow-auto bg-background px-6 py-8 text-foreground">
    <main class="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <!-- 页面标题区开始 -->
      <header class="flex flex-col gap-2">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Notification Diagnostics</p>
        <h1 class="text-2xl font-bold">通知测试</h1>
        <p class="max-w-2xl text-sm leading-6 text-muted-foreground">
          这个页面用于手动检查浏览器权限、通知图标、Service Worker 注册和系统通知触发。
        </p>
      </header>
      <!-- 页面标题区结束 -->

      <!-- 状态面板开始 -->
      <section class="grid gap-3 md:grid-cols-2">
        <div
          v-for="item in statusItems"
          :key="item.label"
          class="rounded-lg border border-border bg-card p-4"
        >
          <p class="text-xs font-medium text-muted-foreground">{{ item.label }}</p>
          <p class="mt-2 text-sm font-semibold" :class="item.ok ? 'text-emerald-600' : 'text-amber-600'">
            {{ item.value }}
          </p>
        </div>
      </section>
      <!-- 状态面板结束 -->

      <!-- 操作区开始 -->
      <section class="rounded-lg border border-border bg-card p-4">
        <div class="flex flex-wrap gap-3">
          <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background" @click="refreshDiagnostics">
            刷新状态
          </button>
          <button class="rounded-md border border-border px-4 py-2 text-sm font-medium" @click="requestNotificationPermission">
            申请权限
          </button>
          <button class="rounded-md border border-border px-4 py-2 text-sm font-medium" @click="sendForegroundNotification">
            发送前台通知
          </button>
          <button class="rounded-md border border-border px-4 py-2 text-sm font-medium" @click="sendServiceWorkerNotification">
            发送 SW 通知
          </button>
          <button class="rounded-md border border-border px-4 py-2 text-sm font-medium" @click="checkNotificationIcon">
            检查图标
          </button>
        </div>
      </section>
      <!-- 操作区结束 -->

      <!-- 图标预览开始 -->
      <section class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center gap-4">
          <img :src="iconUrl" alt="notification icon" class="h-16 w-16 rounded-md border border-border bg-background object-contain p-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold">通知图标</p>
            <p class="mt-1 break-all text-xs text-muted-foreground">{{ iconUrl }}</p>
            <p class="mt-2 text-sm" :class="iconOk ? 'text-emerald-600' : 'text-amber-600'">{{ iconMessage }}</p>
          </div>
        </div>
      </section>
      <!-- 图标预览结束 -->

      <!-- 日志区开始 -->
      <section class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm font-semibold">运行日志</p>
          <button class="text-xs font-medium text-muted-foreground hover:text-foreground" @click="logs = []">
            清空
          </button>
        </div>
        <ol class="flex max-h-72 flex-col gap-2 overflow-auto text-sm">
          <li v-for="(log, index) in logs" :key="`${index}-${log}`" class="rounded-md bg-muted px-3 py-2">
            {{ log }}
          </li>
        </ol>
      </section>
      <!-- 日志区结束 -->
    </main>
  </div>
</template>

<script lang="ts" setup>
/**
 * NotificationTest 页面脚本
 * 职责：提供手动通知诊断入口，帮助定位权限、图标、Service Worker 与系统通知问题。
 * 数据流：按钮操作 → 浏览器 Notification / Service Worker API → 状态面板与日志输出
 */

// ── 依赖导入 ──
import { computed, onMounted, ref } from 'vue'

// ── 常量 ──
// 通知专用图标路径，必须和 useNotifications / sw.js 保持一致
const iconUrl = '/notification-icon.png'

// ── 状态 ──
// 当前浏览器通知权限状态
const permission = ref<string>('unknown')
// 当前页面是否处于安全上下文，非安全上下文无法稳定使用通知能力
const secureContext = ref(false)
// 当前浏览器是否支持 Notification API
const notificationSupported = ref(false)
// 当前浏览器是否支持 Service Worker
const serviceWorkerSupported = ref(false)
// 当前页面是否已被 Service Worker 控制
const serviceWorkerControlled = ref(false)
// 当前 Service Worker 注册状态说明
const serviceWorkerState = ref('未检查')
// 通知图标是否可正常加载
const iconOk = ref(false)
// 通知图标检查结果说明
const iconMessage = ref('未检查')
// 操作日志，记录每次手动测试的结果
const logs = ref<string[]>([])

// ── 计算属性 ──
// 状态面板展示项
const statusItems = computed(() => [
  { label: 'Notification API', value: notificationSupported.value ? '支持' : '不支持', ok: notificationSupported.value },
  { label: '通知权限', value: permission.value, ok: permission.value === 'granted' },
  { label: '安全上下文', value: secureContext.value ? '是' : '否', ok: secureContext.value },
  { label: 'Service Worker', value: serviceWorkerSupported.value ? serviceWorkerState.value : '不支持', ok: serviceWorkerSupported.value },
  { label: 'SW 控制页面', value: serviceWorkerControlled.value ? '是' : '否', ok: serviceWorkerControlled.value },
  { label: '图标资源', value: iconMessage.value, ok: iconOk.value }
])

// ── 方法 ──
// 写入带时间戳的诊断日志
function appendLog(message: string): void {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift(`[${time}] ${message}`)
}

// 获取本地 YYYY-MM-DD 日期，避免 UTC 日期影响通知匹配
function getLocalDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取当前 HH:mm，用于构造立即到点的 SW 测试任务
function getCurrentMinuteTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 读取图片尺寸，确认通知图标可加载
function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('图标加载失败'))
    image.src = `${src}?t=${Date.now()}`
  })
}

// 检查通知图标资源是否可访问且尺寸符合系统通知使用
async function checkNotificationIcon(): Promise<void> {
  try {
    const response = await fetch(iconUrl, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const size = await loadImageSize(iconUrl)
    iconOk.value = size.width >= 96 && size.height >= 96
    iconMessage.value = `${size.width}x${size.height} PNG`
    appendLog(`图标检查完成：${iconMessage.value}`)
  } catch (error) {
    iconOk.value = false
    iconMessage.value = error instanceof Error ? error.message : '图标检查失败'
    appendLog(`图标检查失败：${iconMessage.value}`)
  }
}

// 刷新浏览器通知与 Service Worker 状态
async function refreshDiagnostics(): Promise<void> {
  notificationSupported.value = typeof window !== 'undefined' && 'Notification' in window
  permission.value = notificationSupported.value ? Notification.permission : 'unsupported'
  secureContext.value = typeof window !== 'undefined' ? window.isSecureContext : false
  serviceWorkerSupported.value = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  serviceWorkerControlled.value = serviceWorkerSupported.value ? Boolean(navigator.serviceWorker.controller) : false

  if (serviceWorkerSupported.value) {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    serviceWorkerState.value = registration?.active?.state || registration?.installing?.state || '未注册'
  } else {
    serviceWorkerState.value = '不支持'
  }

  await checkNotificationIcon()
  appendLog('状态已刷新')
}

// 申请浏览器通知权限
async function requestNotificationPermission(): Promise<void> {
  if (!notificationSupported.value) {
    appendLog('当前浏览器不支持 Notification API')
    return
  }

  const result = await Notification.requestPermission()
  permission.value = result
  appendLog(`权限申请结果：${result}`)
}

// 发送前台 Notification API 测试通知
function sendForegroundNotification(): void {
  if (!notificationSupported.value) {
    appendLog('前台通知失败：浏览器不支持 Notification API')
    return
  }

  if (Notification.permission !== 'granted') {
    appendLog(`前台通知失败：当前权限为 ${Notification.permission}`)
    return
  }

  const notification = new Notification('Rhythm 前台通知测试', {
    body: '如果你看到这条，说明 Notification API 和图标都能工作。',
    icon: iconUrl,
    badge: iconUrl,
    tag: `rhythm-foreground-${Date.now()}`
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
  appendLog('前台通知已发送')
}

// 注册或复用当前 Service Worker
async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!serviceWorkerSupported.value) return null

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  serviceWorkerState.value = registration.active?.state || '已注册'
  serviceWorkerControlled.value = Boolean(navigator.serviceWorker.controller)
  return registration
}

// 通过 Service Worker 发送一条立即到点的测试通知
async function sendServiceWorkerNotification(): Promise<void> {
  if (!notificationSupported.value || Notification.permission !== 'granted') {
    appendLog('SW 通知失败：请先授予通知权限')
    return
  }

  const registration = await ensureServiceWorkerRegistration()
  const worker = registration?.active || navigator.serviceWorker.controller
  if (!worker) {
    appendLog('SW 通知失败：Service Worker 尚未激活，请刷新页面后再试')
    return
  }

  const now = new Date()
  const taskId = `diagnostic-${Date.now()}`
  worker.postMessage({
    type: 'UPDATE_TASKS',
    tasks: [{
      id: taskId,
      completed: false,
      time: getCurrentMinuteTime(now),
      type: 'task',
      title: 'SW 通知测试',
      description: '如果你看到这条，说明 Service Worker 通知链路可用。',
      startHour: now.getHours() + now.getMinutes() / 60,
      scheduledDate: getLocalDateOnly(now)
    }]
  })
  worker.postMessage({ type: 'CHECK_NOTIFICATIONS' })
  appendLog(`SW 测试任务已发送：${taskId}`)
}

// ── 生命周期 ──
// 页面加载后自动刷新一次诊断状态
onMounted(() => {
  void refreshDiagnostics()
})
</script>
