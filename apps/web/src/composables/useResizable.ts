/**
 * 可拖拽调整宽度的面板
 *
 * 使用场景：侧边栏等需要用户拖拽边缘来调整宽度的面板
 * 宽度值自动持久化到 localStorage，组件卸载时自动清理事件监听。
 */

// ── 依赖导入 ──
import { ref, onUnmounted, type Ref } from 'vue'

// localStorage 存储键，用于持久化面板宽度
const STORAGE_KEY = 'sidebar-width'

interface UseResizableReturn {
  width: Ref<number>
  isResizing: Ref<boolean>
  startResize: (e: MouseEvent) => void
}

/**
 * 创建可拖拽调整宽度的面板
 *
 * @param initialWidth - 初始宽度（px），默认 420
 * @param minWidth - 最小宽度限制（px），默认 300
 * @param maxWidth - 最大宽度限制（px），默认 600
 */
export function useResizable(initialWidth = 420, minWidth = 300, maxWidth = 600): UseResizableReturn {
  // 优先从 localStorage 读取上次保存的宽度
  const storedWidth = localStorage.getItem(STORAGE_KEY)
  const startWidth = storedWidth ? parseInt(storedWidth) : initialWidth

  // ── 状态 ──
  // 当前面板宽度
  const width = ref(startWidth)
  // 是否正在拖拽中
  const isResizing = ref(false)

  // ── 方法 ──
  // 拖拽过程中实时更新宽度，限制在 min/max 范围内
  const handleResize = (e: MouseEvent): void => {
    if (!isResizing.value) return
    let newWidth = e.clientX
    if (newWidth < minWidth) newWidth = minWidth
    if (newWidth > maxWidth) newWidth = maxWidth
    width.value = newWidth
  }

  // 停止拖拽：移除事件监听，恢复光标样式，持久化宽度
  const stopResize = (): void => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    localStorage.setItem(STORAGE_KEY, String(width.value))
  }

  // 开始拖拽：先移除可能残留的旧监听器防止快速 mousedown 叠加
  const startResize = (e: MouseEvent): void => {
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)

    isResizing.value = true
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // 组件卸载时自动停止拖拽，防止内存泄漏
  onUnmounted(() => {
    stopResize()
  })

  return {
    width,
    isResizing,
    startResize
  }
}
