import { ref, onUnmounted } from 'vue'

const STORAGE_KEY = 'sidebar-width'

export function useResizable(initialWidth = 420, minWidth = 300, maxWidth = 600) {
    // Initialize from storage if available
    const storedWidth = localStorage.getItem(STORAGE_KEY)
    const startWidth = storedWidth ? parseInt(storedWidth) : initialWidth

    const width = ref(startWidth)
    const isResizing = ref(false)

    const handleResize = (e) => {
        if (!isResizing.value) return
        let newWidth = e.clientX
        if (newWidth < minWidth) newWidth = minWidth
        if (newWidth > maxWidth) newWidth = maxWidth
        width.value = newWidth
    }

    const stopResize = () => {
        isResizing.value = false
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', stopResize)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        // Save to storage
        localStorage.setItem(STORAGE_KEY, width.value)
    }

    const startResize = (e) => {
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
