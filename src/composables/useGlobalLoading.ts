import NProgress from 'nprogress'
import { computed, ref, type ComputedRef } from 'vue'

NProgress.configure({
  showSpinner: false,
  trickle: true,
  trickleSpeed: 120,
  minimum: 0.08
})

// 延迟阈值：防止极短请求导致闪烁
const SHOW_DELAY_MS = 200
// 最小可见时长：避免 loading 闪烁
const MIN_VISIBLE_MS = 300

const pendingCount = ref(0)
const visible = ref(false)
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let visibleAt = 0

function startProgressBar(): void {
  if (visible.value) return
  visible.value = true
  visibleAt = Date.now()
  hideTimer = null
  NProgress.start()
}

function finishProgressBar(): void {
  if (!visible.value) return
  visible.value = false
  hideTimer = null
  NProgress.done()
}

// 增加 pending 计数，首个请求延迟显示 loading
function beginGlobalLoading(): void {
  pendingCount.value++
  if (pendingCount.value === 1) {
    clearTimeout(hideTimer!)
    hideTimer = null
    showTimer = setTimeout(() => {
      showTimer = null
      startProgressBar()
    }, SHOW_DELAY_MS)
  }
}

// 路由切换与接口请求共享计数器，避免进度条被提前结束
function beginRouteLoading(): void {
  beginGlobalLoading()
}

// 减少 pending 计数，归零后按最小可见时长延迟隐藏
function endGlobalLoading(): void {
  if (pendingCount.value <= 0) return
  pendingCount.value--
  if (pendingCount.value === 0) {
    clearTimeout(showTimer!)
    showTimer = null
    if (!visible.value) return
    const elapsed = Date.now() - visibleAt
    const remaining = MIN_VISIBLE_MS - elapsed
    if (remaining > 0) {
      hideTimer = setTimeout(() => {
        finishProgressBar()
      }, remaining)
    } else {
      finishProgressBar()
    }
  }
}

function endRouteLoading(): void {
  endGlobalLoading()
}

async function trackGlobalLoading<T>(fn: () => Promise<T>): Promise<T> {
  beginGlobalLoading()
  try {
    return await fn()
  } finally {
    endGlobalLoading()
  }
}

interface UseGlobalLoadingReturn {
  isGlobalLoading: ComputedRef<boolean>
  globalPendingCount: ComputedRef<number>
}

function useGlobalLoading(): UseGlobalLoadingReturn {
  return {
    isGlobalLoading: computed(() => visible.value),
    globalPendingCount: computed(() => pendingCount.value)
  }
}

function cleanup(): void {
  clearTimeout(showTimer!)
  clearTimeout(hideTimer!)
  showTimer = null
  hideTimer = null
  pendingCount.value = 0
  visible.value = false
  NProgress.done()
}

export {
  beginGlobalLoading,
  beginRouteLoading,
  endGlobalLoading,
  endRouteLoading,
  trackGlobalLoading,
  useGlobalLoading,
  cleanup
}
