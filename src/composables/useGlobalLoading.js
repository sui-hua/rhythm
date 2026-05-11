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
 * - beginRouteLoading()    → 路由切换开始时显示 loading
 * - endRouteLoading()      → 路由切换结束时隐藏 loading
 *
 * @module composables/useGlobalLoading
 * @author rhythm dev team
 * @since 2024
 */
import NProgress from 'nprogress'
import { computed, ref } from 'vue'

NProgress.configure({
  showSpinner: false,
  trickle: true,
  trickleSpeed: 120,
  minimum: 0.08
})

/**
 * 延迟显示阈值（毫秒）
 * 防止极短请求（如 <200ms）导致 loading 闪烁
 */
const SHOW_DELAY_MS = 200

/**
 * 最小可见时长（毫秒）
 * 确保 loading 即使立即完成也至少显示 300ms，避免闪烁
 */
const MIN_VISIBLE_MS = 300

/**
 * 当前pending中的请求数量
 * 支持多个并发请求合并计数：计数>0时保持loading
 */
const pendingCount = ref(0)

/**
 * loading提示框的实际可见状态
 * 经过SHOW_DELAY_MS延迟后才变为true，经过MIN_VISIBLE_MS后才变为false
 */
const visible = ref(false)

/**
 * 延迟显示loading的setTimeout ID
 * @type {number|null}
 */
let showTimer = null

/**
 * 延迟隐藏loading的setTimeout ID
 * @type {number|null}
 */
let hideTimer = null

/**
 * loading开始可见的时间戳（Date.now()）
 * 用于计算是否已达到最小显示时长
 * @type {number}
 */
let visibleAt = 0

function startProgressBar() {
  if (visible.value) return
  visible.value = true
  visibleAt = Date.now()
  hideTimer = null
  NProgress.start()
}

function finishProgressBar() {
  if (!visible.value) return
  visible.value = false
  hideTimer = null
  NProgress.done()
}

/**
 * 开始全局loading
 * - 增加pending计数
 * - 如果是第一个请求，则延迟SHOW_DELAY_MS后显示loading
 * - 支持嵌套调用（多个begin需对应多个end）
 *
 * @function beginGlobalLoading
 * @example
 * // 手动控制
 * beginGlobalLoading()
 * await fetchData()
 * endGlobalLoading()
 */
function beginGlobalLoading() {
  pendingCount.value++
  if (pendingCount.value === 1) {
    clearTimeout(hideTimer)
    hideTimer = null
    showTimer = setTimeout(() => {
      showTimer = null
      startProgressBar()
    }, SHOW_DELAY_MS)
  }
}

/**
 * 开始路由加载
 * 路由切换与接口请求共享同一计数器，避免顶部进度条被提前结束。
 */
function beginRouteLoading() {
  beginGlobalLoading()
}

/**
 * 结束全局loading
 * - 减少pending计数
 * - 如果计数归零，则计算剩余显示时间
 * - 剩余时间>0则延迟隐藏，否则立即隐藏
 *
 * @function endGlobalLoading
 * @returns {void}
 * @description
 * 防闪烁逻辑：
 * 1. 清除延迟显示定时器（如果loading还未显示）
 * 2. 计算已显示时长 = now - visibleAt
 * 3. 若已显示时长 < MIN_VISIBLE_MS，则等待剩余时间后再隐藏
 * 4. 否则立即隐藏
 */
function endGlobalLoading() {
  if (pendingCount.value <= 0) return
  pendingCount.value--
  if (pendingCount.value === 0) {
    clearTimeout(showTimer)
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

/**
 * 结束路由加载
 * 与 beginRouteLoading() 配对使用。
 */
function endRouteLoading() {
  endGlobalLoading()
}

/**
 * 包装异步函数，自动追踪其loading状态
 * 在函数执行期间显示global loading，执行完毕后自动结束
 *
 * @function trackGlobalLoading
 * @param {Function} fn - 异步函数（返回Promise）
 * @param {Object} [options={}] - 可选配置（预留扩展）
 * @returns {Promise<*>} 原函数fn的返回结果
 * @example
 * const data = await trackGlobalLoading(() => api.fetchUsers())
 *
 * // 支持async/await语法糖
 * const result = await trackGlobalLoading(async () => {
 *   const users = await fetchUsers()
 *   return users.filter(u => u.active)
 * })
 */
async function trackGlobalLoading(fn, options = {}) {
  beginGlobalLoading()
  try {
    return await fn()
  } finally {
    endGlobalLoading()
  }
}

/**
 * 获取全局loading状态
 * - 返回当前loading可见性（经过防闪烁计算）
 * - 返回当前pending请求计数
 *
 * @function useGlobalLoading
 * @returns {Object} 包含以下属性：
 *   - isGlobalLoading: ComputedRef<boolean> - loading是否可见
 *   - globalPendingCount: ComputedRef<number> - 当前pending请求数
 * @example
 * const { isGlobalLoading, globalPendingCount } = useGlobalLoading()
 *
 * // 在模板中使用
 * // <div v-if="isGlobalLoading">加载中...</div>
 */
function useGlobalLoading() {
  return {
    isGlobalLoading: computed(() => visible.value),
    globalPendingCount: computed(() => pendingCount.value)
  }
}

export {
  beginGlobalLoading,
  beginRouteLoading,
  endGlobalLoading,
  endRouteLoading,
  trackGlobalLoading,
  useGlobalLoading
}
