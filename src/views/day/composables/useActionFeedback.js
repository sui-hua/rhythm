import { useToast } from '@/composables/useToast'

export function useActionFeedback() {
    const { toast } = useToast()

    const success = (message = '操作成功') => {
        toast.success(message)
    }

    const error = (message = '操作失败', err) => {
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
