import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throttle, withLoadingLock } from '../throttle'

// ── throttle 测试 ──
describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 首次调用立即执行（leading 策略）
  it('首次调用立即执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 500)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  // 冷却期内重复调用不立即执行
  it('冷却期内调用不立即执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 500)

    throttled()
    throttled()
    throttled()
    // 只有首次立即执行
    expect(fn).toHaveBeenCalledTimes(1)
  })

  // trailing 策略：冷却期内首次设置 timer，结束后执行
  it('冷却期结束后执行 trailing 调用', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 500)

    throttled('first')
    // 首次立即执行
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('first')

    vi.advanceTimersByTime(100)
    throttled('second')
    // 此时进入冷却期，设置 trailing timer，捕获 'second'
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttled('third')
    // timer 已存在，本次调用被忽略，trailing 仍使用 'second'

    // 等待冷却期结束，trailing 执行
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledWith('second')
  })

  // 冷却期结束后新的调用又立即执行
  it('冷却期结束后新调用立即执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 500)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    // 等冷却期完全结束
    vi.advanceTimersByTime(600)

    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  // 不同的 delay 参数生效
  it('自定义 delay 参数生效', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 1000)

    throttled()
    vi.advanceTimersByTime(500)
    throttled()
    // 500ms < 1000ms，仍在冷却期
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(500)
    // trailing 执行
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

// ── withLoadingLock 测试 ──
describe('withLoadingLock', () => {
  // 上一次 Promise 完成前阻止重复调用
  it('并发调用时只执行第一次，后续返回 undefined', async () => {
    let resolve: (v: unknown) => void
    const p = new Promise((r) => { resolve = r })
    const fn = vi.fn().mockReturnValue(p)
    const locked = withLoadingLock(fn)

    // 第一次调用
    const first = locked()
    // 第二次调用，应被阻止
    const second = locked()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(await second).toBeUndefined()

    // 解锁第一次调用
    resolve!(undefined)
    await first
  })

  // 第一次完成后可以再次调用
  it('Promise 完成后可以再次调用', async () => {
    const fn = vi.fn().mockResolvedValue('result')
    const locked = withLoadingLock(fn)

    const first = await locked()
    expect(first).toBe('result')

    const second = await locked()
    expect(second).toBe('result')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  // 异常时也能正确解锁，不影响后续调用
  it('异常时自动解锁，后续调用不受影响', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok')
    const locked = withLoadingLock(fn)

    // 第一次抛出异常
    await expect(locked()).rejects.toThrow('fail')

    // 异常后应已解锁，可以再次调用
    const result = await locked()
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
