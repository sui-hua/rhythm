import { ref, onUnmounted, computed } from 'vue'

/**
 * 任务计时器 Composable (useTaskTimer.js)
 * 用于管理单个任务的实时计时逻辑。
 */
export function useTaskTimer() {
  const timer = ref(null)
  const serverStartTime = ref(null)
  const now = ref(Date.now())

  // 计算已用时间（秒）
  const elapsedSeconds = computed(() => {
    if (!serverStartTime.value) return 0
    const start = new Date(serverStartTime.value).getTime()
    return Math.max(0, Math.floor((now.value - start) / 1000))
  })

  // 格式化时间显示 (MM:SS 或 HH:MM:SS)
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const start = (startTime) => {
    serverStartTime.value = startTime
    if (timer.value) clearInterval(timer.value)
    
    now.value = Date.now()
    timer.value = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  }

  const stop = () => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
    serverStartTime.value = null
  }

  onUnmounted(() => stop())

  return {
    elapsedSeconds,
    formattedTime: computed(() => formatTime(elapsedSeconds.value)),
    start,
    stop
  }
}
