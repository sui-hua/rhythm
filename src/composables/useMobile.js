/**
 * 响应式移动设备检测 Composable
 * 通过 matchMedia 监听视口宽度变化，返回 isMobile ref
 */
import { ref, onMounted, onUnmounted } from 'vue'

export function useMobile(breakpoint = 768) {
    const isMobile = ref(false)
    let mql = null

    const updateTarget = (e) => {
        isMobile.value = e.matches
    }

    onMounted(() => {
        mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
        mql.addEventListener('change', updateTarget)
        isMobile.value = mql.matches
    })

    onUnmounted(() => {
        if (mql) {
            mql.removeEventListener('change', updateTarget)
        }
    })

    return {
        isMobile
    }
}
