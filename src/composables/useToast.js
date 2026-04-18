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
 */
import { toast } from 'vue-sonner'

export function useToast() {
  return { toast }
}
