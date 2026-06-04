import { useToast } from '@/composables/useToast'

/**
 * 操作反馈 composable
 * 提供 success/error 两个快捷方法，统一 toast 提示行为
 */
export function useActionFeedback() {
    const { toast } = useToast()

    // 成功提示，默认消息为"操作成功"
    const success = (message = '操作成功') => {
        toast.success(message)
    }

    // 错误提示，附带可选的 error 对象用于控制台输出
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
