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
