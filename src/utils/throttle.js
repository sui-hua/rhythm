/**
 * ============================================
 * 节流与防抖工具 (utils/throttle.js)
 * ============================================
 *
 * 【模块职责】
 * - throttle() → 时间节流，限制函数执行频率
 * - withLoadingLock() → 异步请求锁，防止重复提交
 *
 * 【使用场景】
 * - 防止按钮重复点击
 * - 搜索建议请求
 * - 表单提交防抖
 */

/**
 * 节流函数 (Throttle)
 * 用于限制函数执行频率，确保在设定的时间内只执行一次。
 * 特别适用于防止按钮重复点击、搜索建议请求等场景。
 *
 * @param {Function} fn - 需要执行的回调函数
 * @param {number} delay - 节流的时间间隔（毫秒），默认 500ms
 * @returns {Function} - 返回一个新的节流函数
 */
export function throttle(fn, delay = 500) {
  let timer = null;
  let lastTime = 0;

  return function (...args) {
    const now = Date.now();

    // 如果已经超出了冷却时间，立即执行并在本次执行后重新进入冷却
    if (now - lastTime >= delay) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      fn.apply(this, args);
      lastTime = now;
    } else {
      // 如果还在冷却期且没有设置定时器，则设置一个定时器，
      // 保证最后一次触发能在冷却结束后被执行一次 (Trailing)
      if (!timer) {
        timer = setTimeout(() => {
          fn.apply(this, args);
          lastTime = Date.now();
          timer = null;
        }, delay - (now - lastTime));
      }
    }
  };
}

/**
 * 带有”正在加载”状态锁定的节流函数 (Loading Lock)
 * 专门用于异步请求，在 promise resolve/reject 之前，不允许再次重复调用。
 * 相比时间节流，这在处理网络请求时通常更为精确。
 *
 * @param {Function} asyncFn - 需要执行的异步函数（必须返回 Promise）
 * @returns {Function} - 返回一个新的包装后的函数
 */
export function withLoadingLock(asyncFn) {
  let isLoading = false;

  return async function (...args) {
    if (isLoading) return;
    isLoading = true;
    try {
      return await asyncFn.apply(this, args);
    } finally {
      isLoading = false;
    }
  };
}
