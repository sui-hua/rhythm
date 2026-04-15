/**
 * Toast 通知 Composable
 * 封装 vue-sonner 的 toast 方法供组件使用
 */
import { toast } from 'vue-sonner'

export function useToast() {
  return { toast }
}
