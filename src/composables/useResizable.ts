import { ref, onUnmounted, type Ref } from 'vue'

const STORAGE_KEY = 'sidebar-width'

interface UseResizableReturn {
  width: Ref<number>
  isResizing: Ref<boolean>
  startResize: (e: MouseEvent) => void
}

/**
 * @param initialWidth - 初始宽度（px），默认 420
 * @param minWidth - 最小宽度限制（px），默认 300
 * @param maxWidth - 最大宽度限制（px），默认 600
 */
export function useResizable(initialWidth = 420, minWidth = 300, maxWidth = 600): UseResizableReturn {
  const storedWidth = localStorage.getItem(STORAGE_KEY)
  const startWidth = storedWidth ? parseInt(storedWidth) : initialWidth

  const width = ref(startWidth)
  const isResizing = ref(false)

  const handleResize = (e: MouseEvent): void => {
    if (!isResizing.value) return
    let newWidth = e.clientX
    if (newWidth < minWidth) newWidth = minWidth
    if (newWidth > maxWidth) newWidth = maxWidth
    width.value = newWidth
  }

  const stopResize = (): void => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    localStorage.setItem(STORAGE_KEY, String(width.value))
  }

  const startResize = (e: MouseEvent): void => {
    // 先移除可能残留的旧监听器，防止快速 mousedown 叠加
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)

    isResizing.value = true
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  onUnmounted(() => {
    stopResize()
  })

  return {
    width,
    isResizing,
    startResize
  }
}
