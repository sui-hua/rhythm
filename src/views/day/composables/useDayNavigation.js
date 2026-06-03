import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDayStore } from '@/stores/dayStore'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { buildDayPath, getRouteDateContext } from '@/views/day/utils/routeDateContext'
import { getInitialScrollTarget } from '@/views/day/utils/getInitialScrollTarget'
import { isSameDay } from '@/utils/dateFormatter'

export function useDayNavigation() {
    const dayStore = useDayStore()
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

    // 14:30 → 14.5
    const updateCurrentHour = () => {
        const now = new Date()
        currentHour.value = now.getHours() + now.getMinutes() / 60
    }

    const validateDayRoute = () => {
        const context = getRouteDateContext(route.params, dateStore.currentDate)
        const hasAnyRouteParam = route.params.year !== undefined
            || route.params.month !== undefined
            || route.params.day !== undefined

        if (!hasAnyRouteParam) {
            return true
        }

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

    const handleFirstEntryForDay = async (targetDate) => {
        if (!targetDate) return
        const today = new Date()
        if (isSameDay(targetDate, today)) await openIfNeeded()
    }

    const getTargetDateFromRoute = () => {
        return getRouteDateContext(route.params, dateStore.currentDate).date
    }

    const syncDateWithRoute = () => {
        const { year, month, day } = getRouteDateContext(route.params, dateStore.currentDate)
        dateStore.setYearMonthDay(year, month - 1, day)
    }

    const scrollToInitialTarget = (targetDate) => {
        const initialTarget = getInitialScrollTarget({
            schedule: dayStore.dailySchedule,
            targetDate,
            now: new Date()
        })

        if (initialTarget.type === 'task') {
            scrollToTask(initialTarget.index, 'instant')
            return
        }

        const hour = initialTarget.type === 'current-time'
            ? initialTarget.hour
            : 8
        const targetEl = document.getElementById(`hour-${hour}`)

        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'instant', block: 'start' })
        }
    }

    const handleRouteSync = async () => {
        if (!validateDayRoute()) return false

        const targetDate = getTargetDateFromRoute()
        await handleFirstEntryForDay(targetDate)
        syncDateWithRoute()
        await dayStore.fetchTasks({ showLoading: true })
        return true
    }

    let intervalId = null

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId)
    })

    // 页面挂载初始化：校验路由、加载数据、滚动定位、淡入显示、启动时间线刷新
    onMounted(async () => {
        const isValid = await handleRouteSync()
        if (!isValid) return

        await nextTick()
        scrollToInitialTarget(getTargetDateFromRoute())

        requestAnimationFrame(() => {
            setTimeout(() => {
                isReady.value = true
            }, 50)
        })

        intervalId = setInterval(updateCurrentHour, 1000)
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
        isLoading: dayStore.isLoading,
        scrollToTask,
        updateCurrentHour,
        validateDayRoute
    }
}
