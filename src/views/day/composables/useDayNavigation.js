import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

/**
 * Day 视图导航与交互管理 (Composable)
 * 包含路由校验跳转、当前时间指针以及滚动定位方法
 */
export function useDayNavigation(selectedMonth) {
    const router = useRouter()
    const route = useRoute()

    const currentHour = ref(new Date().getHours() + new Date().getMinutes() / 60)

    const scrollToTask = (index, behavior = 'smooth') => {
        const el = document.getElementById(`task-${index}`)
        if (el) el.scrollIntoView({ behavior, block: 'center' })
    }

    const goBackToMonth = () => {
        if (selectedMonth && selectedMonth.value) {
            router.push(`/month/${selectedMonth.value.index + 1}`)
        } else {
            router.push('/year')
        }
    }

    const updateCurrentHour = () => {
        const now = new Date()
        currentHour.value = now.getHours() + now.getMinutes() / 60
    }

    const validateDayRoute = () => {
        if (route.params.monthIndex && route.params.day) {
            const monthIndex = parseInt(route.params.monthIndex)
            const day = parseInt(route.params.day)
            if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12 || isNaN(day) || day < 1 || day > 31) {
                router.push('/year')
            }
        }
    }

    return {
        currentHour,
        scrollToTask,
        goBackToMonth,
        updateCurrentHour,
        validateDayRoute
    }
}
