import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDayStore } from '@/stores/dayStore'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { buildDayPath, getRouteDateContext } from '@/views/day/utils/routeDateContext'
import { getInitialScrollTarget } from '@/views/day/utils/getInitialScrollTarget'
import { isSameDay } from '@/utils/dateFormatter'

// useDayNavigation 可接收外部日报实例，避免触发逻辑和弹窗状态分离
interface UseDayNavigationOptions {
    dailyReport?: Pick<ReturnType<typeof useDailyReport>, 'openIfNeeded'>
}

/**
 * 日页面导航 Composable
 *
 * 使用场景：Day 页面的路由校验、日期同步、数据加载、滚动定位
 * 数据流：路由参数 → dateStore → dayStore → 组件
 */
export function useDayNavigation(options: UseDayNavigationOptions = {}) {
    const dayStore = useDayStore()
    const router = useRouter()
    const route = useRoute()
    const dateStore = useDateStore()
    const { openIfNeeded } = options.dailyReport ?? useDailyReport()

    // 当前时间的小时数（带小数，如 14:30 → 14.5），用于时间线当前时刻指示器
    const currentHour: Ref<number> = ref(new Date().getHours() + new Date().getMinutes() / 60)
    // 页面是否就绪，控制淡入动画时机，避免白屏闪烁
    const isReady: Ref<boolean> = ref(false)

    /**
     * 滚动到指定索引的任务
     * behavior='smooth' 用于用户交互，'instant' 用于页面初始化
     */
    const scrollToTask = (index: number, behavior: ScrollBehavior = 'smooth') => {
        const el = document.getElementById(`task-${index}`)
        if (el) el.scrollIntoView({ behavior, block: 'center' })
    }

    /**
     * 定时刷新当前时间
     * 用于时间线指示器实时更新，通过 setInterval 调用
     */
    const updateCurrentHour = () => {
        const now = new Date()
        currentHour.value = now.getHours() + now.getMinutes() / 60
    }

    /**
     * 校验路由参数是否合法
     * 不合法时重定向到规范路径，避免无效参数导致页面异常
     */
    const validateDayRoute = (): boolean => {
        const context = getRouteDateContext(route.params as Record<string, string | undefined>, dateStore.currentDate)
        // 无路由参数时视为合法，使用默认日期
        const hasAnyRouteParam = route.params.year !== undefined
            || route.params.month !== undefined
            || route.params.day !== undefined

        if (!hasAnyRouteParam) {
            return true
        }

        // 参数解析失败时重定向到规范路径
        if (!context.hasParsedParams) {
            router.replace(buildDayPath(context.date))
            return false
        }

        // 参数存在但非标准格式时重定向（如 /day/2024/1/1 → /day/2024/01/01）
        if (!context.isCanonical) {
            router.replace(buildDayPath(context.date))
            return false
        }

        return true
    }

    /**
     * 当天首次进入时触发日报弹窗检查
     * 仅在目标日期为今天时触发，避免非当天页面弹出日报
     */
    const handleFirstEntryForDay = async (targetDate: Date) => {
        if (!targetDate) return
        const today = new Date()
        if (isSameDay(targetDate, today)) await openIfNeeded()
    }

    /**
     * 从路由参数解析目标日期
     * 使用 dateStore.currentDate 作为 fallback，确保无参数时也有默认值
     */
    const getTargetDateFromRoute = (): Date => {
        return getRouteDateContext(route.params as Record<string, string | undefined>, dateStore.currentDate).date
    }

    /**
     * 将路由参数同步到 dateStore
     * 保持全局日期状态与 URL 一致，month 已统一为 1-indexed
     */
    const syncDateWithRoute = () => {
        const { year, month, day } = getRouteDateContext(route.params as Record<string, string | undefined>, dateStore.currentDate)
        dateStore.setYearMonthDay(year, month, day)
    }

    /**
     * 滚动到初始目标位置
     * 优先滚动到首个未完成任务，其次到当前时间，最后默认 8 点
     */
    const scrollToInitialTarget = (targetDate: Date) => {
        const initialTarget = getInitialScrollTarget({
            schedule: dayStore.dailySchedule,
            targetDate,
            now: new Date()
        })

        // 有未完成任务时，滚动到该任务位置
        if (initialTarget.type === 'task') {
            scrollToTask(initialTarget.index!, 'instant')
            return
        }

        // 当前时间或默认 8 点
        const hour = initialTarget.type === 'current-time'
            ? initialTarget.hour!
            : 8
        const targetEl = document.getElementById(`hour-${hour}`)

        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'instant', block: 'start' })
        }
    }

    /**
     * 路由同步主流程：校验 → 日报检查 → 日期同步 → 数据加载
     * 返回 false 表示校验失败，调用方应中断后续流程
     */
    const handleRouteSync = async (): Promise<boolean> => {
        if (!validateDayRoute()) return false

        const targetDate = getTargetDateFromRoute()
        await handleFirstEntryForDay(targetDate)
        syncDateWithRoute()
        await dayStore.fetchTasks({ showLoading: true })
        return true
    }

    // 时间线刷新定时器 ID，用于页面卸载时清理
    let intervalId: ReturnType<typeof setInterval> | null = null

    // 页面卸载时清理定时器，避免内存泄漏
    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId)
    })

    /**
     * 页面挂载初始化
     * 流程：校验路由 → 数据加载 → 滚动定位 → 淡入显示 → 启动时间线刷新
     */
    onMounted(async () => {
        const isValid = await handleRouteSync()
        if (!isValid) return

        // 等待 DOM 更新完成后再滚动，确保目标元素已渲染
        await nextTick()
        scrollToInitialTarget(getTargetDateFromRoute())

        // 使用 rAF + setTimeout 确保滚动完成后再显示，避免视觉跳动
        requestAnimationFrame(() => {
            setTimeout(() => {
                isReady.value = true
            }, 50)
        })

        // 每分钟刷新当前时间，保持时间线指示器分钟级精度
        intervalId = setInterval(updateCurrentHour, 60000)
    })

    // 监听路由参数变化，重新同步数据和日期状态
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
