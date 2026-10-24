import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock useToast，捕获 success/error 调用
const mockSuccess = vi.fn()
const mockError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    toast: {
      success: mockSuccess,
      error: mockError
    }
  })
}))

import { useActionFeedback } from '@/composables/useActionFeedback'

describe('useActionFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('success 使用默认消息调用 toast.success', () => {
    const { success } = useActionFeedback()
    success()
    expect(mockSuccess).toHaveBeenCalledWith('操作成功')
  })

  it('error 使用自定义消息调用 toast.error', () => {
    const { error } = useActionFeedback()
    error('状态更新失败，已恢复原状态')
    expect(mockError).toHaveBeenCalledWith('状态更新失败，已恢复原状态')
  })

  it('error 附带错误对象时同时输出 console.error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('write failed')
    const { error } = useActionFeedback()

    error('操作失败', err)

    expect(mockError).toHaveBeenCalledWith('操作失败')
    expect(consoleSpy).toHaveBeenCalledWith('操作失败', err)
    consoleSpy.mockRestore()
  })
})
