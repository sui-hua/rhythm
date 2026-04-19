/**
 * ============================================
 * Action Feedback Composable (composables/useActionFeedback.js)
 * ============================================
 *
 * 【模块职责】
 * - 提供统一的操作反馈（成功/失败 toast）
 * - 封装 CRUD 操作后的用户反馈逻辑
 *
 * 【使用方式】
 * import { useActionFeedback } from '@/views/day/composables/useActionFeedback'
 * const { success, error } = useActionFeedback()
 *
 * success('创建成功')
 * error('创建失败', errorObject)
 */

import { useToast } from '@/composables/useToast'

/**
 * 统一操作反馈 Composable
 */
export function useActionFeedback() {
    const { toast } = useToast()

    /**
     * 操作成功反馈
     * @param {string} message - 成功消息（可选，默认"操作成功"）
     */
    const success = (message = '操作成功') => {
        toast.success(message)
    }

    /**
     * 操作失败反馈
     * @param {string} message - 错误消息（可选，默认"操作失败"）
     * @param {Error|unknown} [err] - 错误对象（可选，用于 console.error）
     */
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
