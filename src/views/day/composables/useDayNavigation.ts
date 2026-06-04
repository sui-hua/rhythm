import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDayStore } from '@/stores/dayStore'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { buildDayPath, getRouteDateContext } from '@/views/day/utils/routeDateContext'
import { getInitialScrollTarget } from '@/views/day/utils/getInitialScrollTarget'
import { isSameDay } from '@/utils/dateFormatter'

/**
 * 日页面导航 composable
 * 负责路由校验、日期同步、数据加载、滚动定位、时间线刷新
 */
export function useDayNavigation() {
    const dayStore = useDayStore()
    const router = useRouter()
    const route = useRoute()
    const dateStore = useDateStore()
    const { openIfNeeded } = useDailyReport()

    // 当前时间的小时数（带小数，如 14:30 → 14.5）
    const currentHour: Ref<number> = ref(new Date().getHours() + new Date().getMinutes() / 60)
    // 页面是否就绪（用于淡入动画）
    const isReady: Ref<boolean> = ref(false)

    // 滚动到指定索引的任务
    const scrollToTask = (index: number, behavior: ScrollBehavior = 'smooth') => {
        const el = document.getElementById(`task-${index}`)
        if (el) el.scrollIntoView({ behavior, block: 'center' })
    }

    // 14:30 → 14.5，定时刷新当前时间
    const updateCurrentHour = () => {
        const now = new Date()
        currentHour.value = now.getHours() + now.getMinutes() / 60
    }

    // 校验路由参数是否合法，不合法时重定向到规范路径
    const validateDayRoute = (): boolean => {
        const context = getRouteDateContext(route.params as Record<string, string | undefined>, dateStore.currentDate)
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

    // 当天首次进入时触发日报弹窗检查
    const handleFirstEntryForDay = async (targetDate: Date) => {
        if (!targetDate) return
        const today = new Date()
        if (isSameDay(targetDate, today)) await openIfNeeded()
    }

    // 从路由参数解析目标日期
    const getTargetDateFromRoute = (): Date => {
        return getRouteDateContext(route.params as Record<string, string | undefined>, dateStore.currentDate).date
    }

    // 将路由参数同步到 dateStore
    const syncDateWithRoute = () => {
        const { year, month, day } = getRouteDateContext(route.params as Record<string, string | undefined>, dateStore.currentDate)
        dateStore.setYearMonthDay(year, month - 1, day)
    }

    // 滚动到初始目标位置（首个未完成任务或当前时间）
    const scrollToInitialTarget = (targetDate: Date) => {
        const initialTarget = getInitialScrollTarget({
            schedule: dayStore.dailySchedule as any[],
            targetDate,
            now: new Date()
        })

        if (initialTarget.type === 'task') {
            scrollToTask(initialTarget.index!, 'instant')
            return
        }

        const hour = initialTarget.type === 'current-time'
            ? initialTarget.hour!
            : 8
        const targetEl = document.getElementById(`hour-${hour}`)

        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'instant', block: 'start' })
        }
    }

    // 路由同步主流程：校验 → 日报检查 → 日期同步 → 数据加载
    const handleRouteSync = async (): Promise<boolean> => {
        if (!validateDayRoute()) return false

        const targetDate = getTargetDateFromRoute()
        await handleFirstEntryForDay(targetDate)
        syncDateWithRoute()
        await dayStore.fetchTasks({ showLoading: true })
        return true
    }

    // 时间线刷新定时器 ID
    let intervalId: ReturnType<typeof setInterval> | null = null

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

    // 监听路由参数变化，重新同步
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
