/**
 * @file useActionFeedback.js
 * @description 操作反馈Composable - 提供统一的成功/失败Toast提示
 * @module day/composables
 * 
 * ============================================
 * Action Feedback Composable
 * ============================================
 * 
 * 【模块职责】
 * - 提供统一的操作反馈（成功/失败 toast）
 * - 封装 CRUD 操作后的用户反馈逻辑
 * - 统一错误处理和日志输出
 * 
 * 【设计目的】
 * 在日视图(Day)的各个组件中，执行创建、编辑、删除等操作后，
 * 需要给用户明确的成功/失败反馈。此Composable封装了常见的
 * 反馈模式，避免在每个组件中重复编写toast调用逻辑。
 * 
 * 【使用方式】
 * ```javascript
 * import { useActionFeedback } from '@/views/day/composables/useActionFeedback'
 * 
 * const { success, error } = useActionFeedback()
 * 
 * // 成功场景
 * success('创建成功')
 * success() // 使用默认消息"操作成功"
 * 
 * // 失败场景
 * error('创建失败', errorObject)
 * error('删除失败') // 无错误对象时
 * ```
 * 
 * 【依赖关系】
 * - 依赖 useToast composable 提供底层toast能力
 * - 被 day 模块下的各个组件使用（如 Timeline、DayView 等）
 * 
 * @see {@link https://github.com/vueuse/vueuse|GitHub - VueUse}
 * @see {@link useToast}
 */

import { useToast } from '@/composables/useToast'

/**
 * 统一操作反馈 Composable
 * 
 * 封装操作成功/失败后的用户反馈逻辑，返回两个方法：
 * - success: 用于操作成功时显示Toast提示
 * - error: 用于操作失败时显示Toast提示并输出错误日志
 * 
 * @returns {Object} 包含success和error方法的对象
 * @returns {Function} returns.success - 操作成功反馈方法
 * @returns {Function} returns.error - 操作失败反馈方法
 * 
 * @example
 * ```javascript
 * const { success, error } = useActionFeedback()
 * 
 * // 模拟创建操作
 * async function createItem(data) {
 *   try {
 *     await api.create(data)
 *     success('创建成功')
 *   } catch (err) {
 *     error('创建失败', err)
 *   }
 * }
 * ```
 */
export function useActionFeedback() {
    const { toast } = useToast()

    /**
     * 操作成功反馈
     * 
     * 在操作成功时调用，显示绿色/正向的Toast提示。
     * 默认提示文字为"操作成功"，可自定义成功消息内容。
     * 
     * @param {string} [message='操作成功'] - 成功消息文本
     * @param {Object} [options] - 可选的Toast配置项
     * @param {number} [options.duration=2000] - 提示显示时长(ms)
     * @returns {void}
     * 
     * @example
     * ```javascript
     * success('任务已创建')
     * success('习惯打卡成功')
     * success() // 使用默认消息
     * ```
     */
    const success = (message = '操作成功') => {
        toast.success(message)
    }

    /**
     * 操作失败反馈
     * 
     * 在操作失败时调用，显示红色/错误的Toast提示。
     * 同时将错误信息输出到控制台，便于调试和问题排查。
     * 
     * @param {string} [message='操作失败'] - 错误消息文本
     * @param {Error|unknown} [err] - 错误对象（可选）
     *   当传入错误对象时，会同时输出到console.error便于调试
     * @param {Object} [options] - 可选的Toast配置项
     * @param {number} [options.duration=3000] - 提示显示时长(ms)，失败提示通常较长
     * @returns {void}
     * 
     * @example
     * ```javascript
     * // 带错误对象的失败反馈
     * error('保存失败', new Error('网络错误'))
     * 
     * // 仅显示错误提示
     * error('删除失败')
     * 
     * // 使用默认消息
     * error()
     * ```
     */
    const error = (message = '操作失败', err) => {
        toast.error(message)
        if (err) {
            console.error(message, err)
        }
    }

    /**
     * 返回的API对象
     * @typedef {Object} ActionFeedbackAPI
     * @property {Function} success - 操作成功反馈方法
     * @property {Function} error - 操作失败反馈方法
     */

    return {
        success,
        error
    }
}
