/**
 * 时间节流函数，在 delay 毫秒内最多执行一次
 * 采用 leading + trailing 策略：首次触发立即执行，冷却期内最后一次触发也会延迟执行
 *
 * @param fn - 需要节流的目标函数
 * @param delay - 冷却时间（毫秒），默认 500ms
 */
export function throttle<This, Args extends unknown[]>(
  fn: (this: This, ...args: Args) => unknown,
  delay = 500
): (this: This, ...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastTime = 0

  return function (this: This, ...args: Args): void {
    const now = Date.now()

    // 已超出冷却期：立即执行，并重置冷却计时
    if (now - lastTime >= delay) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      fn.apply(this, args)
      lastTime = now
    } else {
      // 冷却期内：仅设置一个尾部定时器，保证最后一次调用不丢失
      if (!timer) {
        timer = setTimeout(() => {
          fn.apply(this, args)
          lastTime = Date.now()
          timer = null
        }, delay - (now - lastTime))
      }
    }
  }
}

/**
 * 异步加载锁：在上一次 Promise 完成前，阻止重复调用
 * 比时间节流更适合网络请求场景，因为锁定时长取决于实际请求耗时而非固定间隔
 *
 * @param asyncFn - 需要包装的异步函数
 * @returns 包装后的函数，重复调用时返回 undefined
 */
export function withLoadingLock<This, Args extends unknown[], Result>(
  asyncFn: (this: This, ...args: Args) => Promise<Result>
): (this: This, ...args: Args) => Promise<Result | void> {
  let isLoading = false

  return async function (this: This, ...args: Args): Promise<Result | void> {
    if (isLoading) return
    isLoading = true
    try {
      return await asyncFn.apply(this, args)
    } finally {
      isLoading = false
    }
  }
}
