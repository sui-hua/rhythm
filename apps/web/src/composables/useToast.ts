/**
 * Toast 通知封装
 *
 * 使用场景：需要在组件中调用 toast 提示的统一入口
 * 对 vue-sonner 的轻量包装，便于后续统一替换或扩展。
 */

// ── 依赖导入 ──
import { toast } from 'vue-sonner'

interface UseToastReturn {
  toast: typeof toast
}

export function useToast(): UseToastReturn {
  return { toast }
}
