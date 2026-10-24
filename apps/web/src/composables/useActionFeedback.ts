import { useToast } from '@/composables/useToast'

/**
 * 通用操作反馈 composable
 *
 * 使用场景：写操作成功/失败后的统一 toast 提示。
 * 数据流：业务操作 → useActionFeedback → vue-sonner toast / console
 */
export function useActionFeedback() {
  const { toast } = useToast()

  // 成功提示，未传入文案时使用通用默认值
  const success = (message = '操作成功') => {
    toast.success(message)
  }

  // 失败提示，同时保留原始错误到控制台，便于排查后端或网络问题
  const error = (message = '操作失败', err?: unknown) => {
    toast.error(message)
    if (err) {
      console.error(message, err)
    }
  }

  return {
    success,
    error
  }
}
