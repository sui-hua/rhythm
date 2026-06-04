/**
 * 全局加载状态管理
 *
 * 使用场景：路由切换和异步请求期间显示顶部进度条
 * 通过引用计数支持多个并发请求，避免进度条被提前结束。
 * 内置延迟显示和最小可见时长，防止极短请求导致闪烁。
 */

// ── 依赖导入 ──
import NProgress from 'nprogress'
import { computed, ref, type ComputedRef } from 'vue'

// NProgress 配置：隐藏 spinner，启用匀速增长
NProgress.configure({
  showSpinner: false,
  trickle: true,
  trickleSpeed: 120,
  minimum: 0.08
})

// ── 常量 ──
// 延迟阈值：首个请求发出后等待此时间才显示进度条，防止极短请求闪烁
const SHOW_DELAY_MS = 200
// 最小可见时长：进度条显示后至少保持此时间，避免闪烁
const MIN_VISIBLE_MS = 300

// ── 内部状态 ──
// 并发请求计数器，归零时隐藏进度条
const pendingCount = ref(0)
// 进度条是否正在显示
const visible = ref(false)
// 延迟显示定时器
let showTimer: ReturnType<typeof setTimeout> | null = null
// 延迟隐藏定时器
let hideTimer: ReturnType<typeof setTimeout> | null = null
// 进度条开始显示的时间戳，用于计算最小可见时长
let visibleAt = 0

// 显示进度条并记录开始时间
function startProgressBar(): void {
  if (visible.value) return
  visible.value = true
  visibleAt = Date.now()
  hideTimer = null
  NProgress.start()
}

// 隐藏进度条并重置状态
function finishProgressBar(): void {
  if (!visible.value) return
  visible.value = false
  hideTimer = null
  NProgress.done()
}

// 增加 pending 计数，首个请求延迟显示进度条
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
    // 计数归零时清除延迟显示定时器（可能还在等待中）
    clearTimeout(showTimer!)
    showTimer = null
    if (!visible.value) return
    // 计算已显示时长，不足最小可见时长时延迟隐藏
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

// 路由切换结束时调用，委托给通用结束函数
function endRouteLoading(): void {
  endGlobalLoading()
}

// 包装异步函数，自动管理加载状态的开始和结束
async function trackGlobalLoading<T>(fn: () => Promise<T>): Promise<T> {
  beginGlobalLoading()
  try {
    return await fn()
  } finally {
    endGlobalLoading()
  }
}

// ── Composable ──
interface UseGlobalLoadingReturn {
  isGlobalLoading: ComputedRef<boolean>
  globalPendingCount: ComputedRef<number>
}

/**
 * 获取全局加载状态的响应式引用
 *
 * 使用场景：需要在组件中读取全局加载状态或 pending 计数
 */
function useGlobalLoading(): UseGlobalLoadingReturn {
  return {
    isGlobalLoading: computed(() => visible.value),
    globalPendingCount: computed(() => pendingCount.value)
  }
}

// 清理所有定时器和状态，用于应用卸载或测试环境
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
