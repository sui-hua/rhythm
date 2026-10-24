import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// mock NProgress，所有方法为空函数
vi.mock('nprogress', () => ({
  default: {
    configure: vi.fn(),
    start: vi.fn(),
    done: vi.fn()
  }
}))

import NProgress from 'nprogress'
import {
  beginGlobalLoading,
  endGlobalLoading,
  trackGlobalLoading,
  useGlobalLoading,
  cleanup
} from '../useGlobalLoading'

// ── useGlobalLoading 测试 ──
describe('useGlobalLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 每个测试前清理状态，确保测试间互不影响
    cleanup()
    vi.mocked(NProgress.start).mockClear()
    vi.mocked(NProgress.done).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 引用计数：begin 增加 pending，end 减少 pending
  it('begin 增加 pending 计数，end 减少 pending 计数', () => {
    const { globalPendingCount } = useGlobalLoading()

    expect(globalPendingCount.value).toBe(0)

    beginGlobalLoading()
    expect(globalPendingCount.value).toBe(1)

    beginGlobalLoading()
    expect(globalPendingCount.value).toBe(2)

    endGlobalLoading()
    expect(globalPendingCount.value).toBe(1)

    endGlobalLoading()
    expect(globalPendingCount.value).toBe(0)
  })

  // begin 时延迟显示进度条，不立即调用 NProgress.start
  it('begin 后延迟显示进度条，不立即调用 NProgress.start', () => {
    beginGlobalLoading()
    // 未到延迟阈值，不应调用 NProgress.start
    expect(NProgress.start).not.toHaveBeenCalled()

    // 超过 SHOW_DELAY_MS (200ms) 后才调用
    vi.advanceTimersByTime(200)
    expect(NProgress.start).toHaveBeenCalledTimes(1)
  })

  // 多个并发 begin 只触发一次 start
  it('多次 begin 只触发一次 NProgress.start', () => {
    beginGlobalLoading()
    beginGlobalLoading()
    beginGlobalLoading()

    vi.advanceTimersByTime(200)
    expect(NProgress.start).toHaveBeenCalledTimes(1)
  })

  // end 归零后进度条隐藏
  it('pending 归零后调用 NProgress.done', () => {
    beginGlobalLoading()
    vi.advanceTimersByTime(200)
    expect(NProgress.start).toHaveBeenCalled()

    // 推进时间使得 visibleAt 足够久，剩余最小可见时长 <= 0
    vi.advanceTimersByTime(300)

    endGlobalLoading()
    // remaining <= 0 时立即调用 done
    expect(NProgress.done).toHaveBeenCalledTimes(1)
  })

  // end 归零时如果剩余最小可见时长 > 0，延迟隐藏
  it('pending 归零时若不足最小可见时长则延迟隐藏', () => {
    beginGlobalLoading()
    // 推进到进度条刚显示
    vi.advanceTimersByTime(200)
    expect(NProgress.start).toHaveBeenCalled()

    // 立即 end，此时 visibleAt 距现在很近，remaining > 0
    endGlobalLoading()
    // 还未调用 done
    expect(NProgress.done).not.toHaveBeenCalled()

    // 推进剩余的最小可见时长 (300ms)
    vi.advanceTimersByTime(300)
    expect(NProgress.done).toHaveBeenCalledTimes(1)
  })

  // end 次数超过 begin 时不崩溃
  it('end 多于 begin 时安全忽略', () => {
    const { globalPendingCount } = useGlobalLoading()

    endGlobalLoading()
    expect(globalPendingCount.value).toBe(0)
    expect(NProgress.done).not.toHaveBeenCalled()
  })

  // trackGlobalLoading 自动管理 begin/end
  it('trackGlobalLoading 正常完成时自动 begin/end', async () => {
    const { globalPendingCount } = useGlobalLoading()

    const result = await trackGlobalLoading(async () => {
      // 函数执行期间 pending > 0
      expect(globalPendingCount.value).toBe(1)
      return 'data'
    })

    expect(result).toBe('data')
    expect(globalPendingCount.value).toBe(0)
  })

  // trackGlobalLoading 异常时也能正确 end
  it('trackGlobalLoading 异常时也能正确 end', async () => {
    const { globalPendingCount } = useGlobalLoading()

    await expect(
      trackGlobalLoading(async () => {
        throw new Error('request failed')
      })
    ).rejects.toThrow('request failed')

    // 异常后 pending 应归零
    expect(globalPendingCount.value).toBe(0)
  })

  // cleanup 重置所有状态和定时器
  it('cleanup 重置所有状态', () => {
    beginGlobalLoading()
    beginGlobalLoading()

    cleanup()

    const { globalPendingCount, isGlobalLoading } = useGlobalLoading()
    expect(globalPendingCount.value).toBe(0)
    expect(isGlobalLoading.value).toBe(false)
    expect(NProgress.done).toHaveBeenCalled()
  })

  // isGlobalLoading 响应式反映 visible 状态
  it('isGlobalLoading 反映进度条可见状态', () => {
    const { isGlobalLoading } = useGlobalLoading()

    expect(isGlobalLoading.value).toBe(false)

    beginGlobalLoading()
    vi.advanceTimersByTime(200)
    expect(isGlobalLoading.value).toBe(true)

    // 推进足够时间后 end
    vi.advanceTimersByTime(300)
    endGlobalLoading()
    expect(isGlobalLoading.value).toBe(false)
  })
})
