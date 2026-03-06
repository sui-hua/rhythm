import { ref, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDayData } from './useDayData'

/**
 * Day 视图导航与交互管理 (Composable)
 * 包含路由校验跳转、当前时间指针、滚动定位以及页面初始化
 */
export function useDayNavigation() {
    const { selectedMonth, dailySchedule, fetchTasks } = useDayData()
    const router = useRouter()
    const route = useRoute()

    const currentHour = ref(new Date().getHours() + new Date().getMinutes() / 60)
    const isReady = ref(false)

    const scrollToTask = (index, behavior = 'smooth') => {
        const el = document.getElementById(`task-${index}`)
        if (el) el.scrollIntoView({ behavior, block: 'center' })
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

    // 页面挂载初始化：校验路由、加载数据、滚动定位、淡入显示、启动时间线刷新
    onMounted(async () => {
        validateDayRoute()

        await fetchTasks()
        await nextTick()

        const schedule = dailySchedule.value
        if (schedule.length > 0) {
            const firstUncompletedIndex = schedule.findIndex(task => !task.completed)
            const targetIndex = firstUncompletedIndex !== -1 ? firstUncompletedIndex : 0
            scrollToTask(targetIndex, 'instant')
        } else {
            const defaultEl = document.getElementById('hour-8')
            if (defaultEl) {
                defaultEl.scrollIntoView({ behavior: 'instant', block: 'start' })
            }
        }

        requestAnimationFrame(() => {
            setTimeout(() => {
                isReady.value = true
            }, 50)
        })

        setInterval(updateCurrentHour, 1000)
    })

    return {
        currentHour,
        isReady,
        scrollToTask,
        updateCurrentHour,
        validateDayRoute
    }
}
