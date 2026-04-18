import { ref, nextTick, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDayData } from './useDayData'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { buildDayPath, getRouteDateContext } from '@/views/day/utils/routeDateContext'

/**
 * Day 视图导航与交互管理 (Composable)
 * 包含路由校验跳转、当前时间指针、滚动定位以及页面初始化
 */
export function useDayNavigation() {
    const { dailySchedule, fetchTasks, isLoading } = useDayData()
    const router = useRouter()
    const route = useRoute()
    const dateStore = useDateStore()
    const { openIfNeeded } = useDailyReport()

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
        const context = getRouteDateContext(route.params, dateStore.currentDate)

        if (!context.hasParsedParams) {
            router.replace(buildDayPath(context.date))
            return false
        }

        if (!context.isCanonical) {
            router.replace(buildDayPath(context.date))
            return false
        }

        return true
    }

    const isSameDay = (a, b) => {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate()
    }

    const handleFirstEntryForDay = async (targetDate) => {
        if (!targetDate) return
        const today = new Date()
        // DB-based: openIfNeeded() will check daily_report_views to decide whether to show the modal.
        if (isSameDay(targetDate, today)) await openIfNeeded()
    }

    const getTargetDateFromRoute = () => {
        return getRouteDateContext(route.params, dateStore.currentDate).date
    }

    const syncDateWithRoute = () => {
        const { year, month, day } = getRouteDateContext(route.params, dateStore.currentDate)
        dateStore.setYearMonthDay(year, month - 1, day)
    }

    const handleRouteSync = async () => {
        if (!validateDayRoute()) return false

        const targetDate = getTargetDateFromRoute()
        await handleFirstEntryForDay(targetDate)
        syncDateWithRoute()
        await fetchTasks({ showLoading: true })
        return true
    }

    // 页面挂载初始化：校验路由、加载数据、滚动定位、淡入显示、启动时间线刷新
    onMounted(async () => {
        const isValid = await handleRouteSync()
        if (!isValid) return

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

    watch(
        () => [route.params.year, route.params.month, route.params.day],
        async () => {
            await handleRouteSync()
        }
    )

    return {
        currentHour,
        isReady,
        isLoading,
        scrollToTask,
        updateCurrentHour,
        validateDayRoute
    }
}
