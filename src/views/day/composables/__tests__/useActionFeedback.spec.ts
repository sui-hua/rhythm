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

import { useActionFeedback } from '../useActionFeedback'

describe('useActionFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // success 方法：使用默认消息调用 toast.success
  it('success() 使用默认消息调用 toast.success', () => {
    const { success } = useActionFeedback()
    success()
    expect(mockSuccess).toHaveBeenCalledWith('操作成功')
  })

  // success 方法：传入自定义消息
  it('success() 支持自定义消息', () => {
    const { success } = useActionFeedback()
    success('保存成功')
    expect(mockSuccess).toHaveBeenCalledWith('保存成功')
  })

  // error 方法：使用默认消息调用 toast.error
  it('error() 使用默认消息调用 toast.error', () => {
    const { error } = useActionFeedback()
    error()
    expect(mockError).toHaveBeenCalledWith('操作失败')
  })

  // error 方法：传入自定义消息
  it('error() 支持自定义消息', () => {
    const { error } = useActionFeedback()
    error('网络异常')
    expect(mockError).toHaveBeenCalledWith('网络异常')
  })

  // error 方法：附带 error 对象时输出到 console.error
  it('error() 附带 err 参数时调用 console.error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { error } = useActionFeedback()
    const errObj = new Error('test')
    error('失败', errObj)
    expect(mockError).toHaveBeenCalledWith('失败')
    expect(consoleSpy).toHaveBeenCalledWith('失败', errObj)
    consoleSpy.mockRestore()
  })

  // error 方法：不传 err 参数时不调用 console.error
  it('error() 不传 err 参数时不调用 console.error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { error } = useActionFeedback()
    error()
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
