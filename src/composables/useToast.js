/**
 * ============================================
 * Toast 提示Composable (composables/useToast.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 vue-sonner 的 toast 方法
 * - 提供全局统一的消息提示接口
 *
 * 【使用方式】
 * const { toast } = useToast()
 * toast.success('操作成功')
 * toast.error('操作失败')
 *
 * 【toast 可用方法】
 * - toast(message)           - 普通文本提示
 * - toast.success(message)   - 成功提示
 * - toast.error(message)     - 错误提示
 * - toast.warning(message)  - 警告提示
 * - toast.info(message)      - 信息提示
 * - toast.loading(message)   - 加载中提示
 *
 * @module composables/useToast
 * @author [项目团队]
 * @version 1.0.0
 */
import { toast } from 'vue-sonner'

/**
 * Toast 提示组合式函数
 *
 * 提供对 vue-sonner toast 实例的响应式访问，用于在应用中弹出提示消息。
 * 这是全局统一的提示入口，所有业务组件都应使用此 composable 而非直接导入 vue-sonner。
 *
 * @returns {Object} 返回包含 toast 方法的对象
 * @returns {Function} returns.toast - vue-sonner 的 toast 实例，封装了多种提示类型
 *
 * @example
 * // 在 Vue 组件中使用
 * <script setup>
 * import { useToast } from '@/composables/useToast'
 *
 * const { toast } = useToast()
 *
 * // 成功提示
 * toast.success('任务已保存')
 *
 * // 错误提示
 * toast.error('保存失败，请重试')
 *
 * // 普通提示
 * toast('这是一条普通消息')
 * </script>
 *
 * @example
 * // 在 composable 或 store 中使用
 * import { useToast } from '@/composables/useToast'
 *
 * export function useMyLogic() {
 *   const { toast } = useToast()
 *
 *   function handleSave() {
 *     try {
 *       // 保存逻辑...
 *       toast.success('保存成功')
 *     } catch (e) {
 *       toast.error('保存失败: ' + e.message)
 *     }
 *   }
 *
 *   return { handleSave }
 * }
 *
 * @see {@link https://vue-sonner.vercel.app/} vue-sonner 官方文档
 */
export function useToast() {
  return { toast }
}
