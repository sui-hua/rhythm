/**
 * ============================================
 * 全局加载状态Composable (composables/useGlobalLoading.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理全局加载状态
 * - 提供防闪烁的 loading 显示逻辑
 * - 避免短请求频繁闪烁
 *
 * 【防闪烁策略】
 * - SHOW_DELAY_MS: 200ms 延迟后才显示 loading
 * - MIN_VISIBLE_MS: 300ms 最短显示时间
 * - pendingCount: 请求计数，支持并发请求合并
 *
 * 【导出函数/对象】
 * - trackGlobalLoading(fn) → 包装异步函数，自动管理 loading
 * - useGlobalLoading()     → 获取当前 loading 状态
 * - beginGlobalLoading()   → 手动显示 loading
 * - endGlobalLoading()     → 手动隐藏 loading
 */
import { computed, ref } from 'vue'

const SHOW_DELAY_MS = 200
const MIN_VISIBLE_MS = 300
const pendingCount = ref(0)
const visible = ref(false)
let showTimer = null
let hideTimer = null
let visibleAt = 0

function beginGlobalLoading() {
  pendingCount.value++
  if (pendingCount.value === 1) {
    showTimer = setTimeout(() => {
      visible.value = true
      visibleAt = Date.now()
    }, SHOW_DELAY_MS)
  }
}

function endGlobalLoading() {
  if (pendingCount.value <= 0) return
  pendingCount.value--
  if (pendingCount.value === 0) {
    clearTimeout(showTimer)
    const elapsed = Date.now() - visibleAt
    const remaining = MIN_VISIBLE_MS - elapsed
    if (remaining > 0) {
      hideTimer = setTimeout(() => {
        visible.value = false
      }, remaining)
    } else {
      visible.value = false
    }
  }
}

async function trackGlobalLoading(fn, options = {}) {
  beginGlobalLoading()
  try {
    return await fn()
  } finally {
    endGlobalLoading()
  }
}

function useGlobalLoading() {
  return {
    isGlobalLoading: computed(() => visible.value),
    globalPendingCount: computed(() => pendingCount.value)
  }
}

export { beginGlobalLoading, endGlobalLoading, trackGlobalLoading, useGlobalLoading }
