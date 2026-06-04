// pomodoroStore.ts

import { defineStore } from 'pinia'
import { ref, computed, onScopeDispose } from 'vue'
import type { ActiveTask } from '@/types/models'

/**
 * 番茄钟状态管理
 * 管理当前活跃任务、计时器和模态框显示状态
 * 计时器基于 setInterval 每秒刷新，组件卸载时自动清理
 */
export const usePomodoroStore = defineStore('pomodoro', () => {
  // ── 状态 ──
  // 当前活跃的番茄钟任务，null 表示无任务在计时
  const activeTask = ref<ActiveTask | null>(null)
  // 模态框显示状态，用户可关闭模态框但计时器继续运行
  const showModal = ref(false)

  // 全局计时器引用，用于驱动 elapsedSeconds 每秒刷新
  const timer = ref<ReturnType<typeof setInterval> | null>(null)
  // 当前时间戳，每秒更新一次，触发 elapsedSeconds 重新计算
  const now = ref(Date.now())

  // ── 计算属性 ──
  // 已过去的秒数，基于任务实际开始时间与当前时间的差值计算
  const elapsedSeconds = computed(() => {
    if (!activeTask.value || !activeTask.value.actual_start_time) return 0
    const start = new Date(activeTask.value.actual_start_time).getTime()
    return Math.max(0, Math.floor((now.value - start) / 1000))
  })

  // 格式化的计时显示：超过 1 小时显示 HH:MM:SS，否则显示 MM:SS
  const formattedTime = computed(() => {
    const total = elapsedSeconds.value
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60

    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  // ── 私有方法 ──
  // 启动每秒刷新的计时器，会先清理已有定时器避免重复
  const startTimer = (): void => {
    if (timer.value) clearInterval(timer.value)
    now.value = Date.now()
    timer.value = setInterval(() => {
      now.value = Date.now()
    }, 1000)
    // 组件卸载时自动清理定时器，防止内存泄漏
    onScopeDispose(() => {
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
    })
  }

  // 停止计时器并清除引用
  const stopTimer = (): void => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  }

  // ── Actions ──
  // 设置活跃任务并启动计时，同时打开模态框
  const setActiveTask = (task: ActiveTask): void => {
    activeTask.value = task
    showModal.value = true
    startTimer()
  }

  // 重置所有番茄钟状态，任务结束或用户主动取消时调用
  const reset = (): void => {
    activeTask.value = null
    showModal.value = false
    stopTimer()
  }

  // 仅关闭模态框，计时器继续运行，用户可随时重新打开
  const closeModal = (): void => {
    showModal.value = false
  }

  // 打开模态框，仅在有活跃任务时生效
  const openModal = (): void => {
    if (activeTask.value) {
      showModal.value = true
    }
  }

  return {
    activeTask,
    showModal,
    elapsedSeconds,
    formattedTime,
    setActiveTask,
    reset,
    closeModal,
    openModal,
    startTimer,
    stopTimer,
    stop: stopTimer
  }
})
