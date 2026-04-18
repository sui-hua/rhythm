/**
 * ============================================
 * 快速添加任务表单 (views/day/composables/useQuickAddForm.js)
 * ============================================
 *
 * 【模块职责】
 * - 提供快速添加任务的表单逻辑
 * - 只需输入标题，时间和时长使用默认值/上次使用值
 * - 表单重置和防抖处理
 *
 * 【表单字段】
 * - title: 任务标题
 * - time: 开始时间（默认上次使用时间）
 * - duration: 时长（默认 0.5 小时）
 * - category: 分类（默认"工作"）
 * - description: 描述
 *
 * 【防抖处理】
 * - 使用 withLoadingLock 防止重复提交
 */
import { ref, reactive, watch } from 'vue'
import { safeDb as db } from '@/services/safeDb'
import { useAuthStore } from '@/stores/authStore'
import { useDateStore } from '@/stores/dateStore'
import { useDayData } from './useDayData'
import { withLoadingLock } from '@/utils/throttle'

/**
 * 快速添加表单逻辑 (Composable)
 * 仅需标题，其他字段全部默认
 */
export function useQuickAddForm(props, emit) {
    const authStore = useAuthStore()
    const dateStore = useDateStore()
    const { fetchTasks } = useDayData()

    // 写操作按钮 loading 状态
    const isSubmitting = ref(false)

    // 记录上次使用的时间（用于连续快速添加）
    const lastUsedTime = ref('08:00')
    const lastUsedDuration = ref(0.5)

    const form = reactive({
        title: '',
        time: '',
        duration: 0.5,
        category: '工作',
        description: ''
    })

    // 监听显示状态，重置表单
    watch(() => props.show, (newShow) => {
        if (newShow) {
            form.title = ''
            form.time = lastUsedTime.value
            form.duration = lastUsedDuration.value
            form.category = '工作'
            form.description = ''
        }
    }, { immediate: true })

    // 快速创建任务
    const quickSubmit = withLoadingLock(async () => {
        if (!form.title) return false

        isSubmitting.value = true
        const [hours, minutes] = form.time.split(':').map(Number)
        const durationValue = parseFloat(form.duration)

        try {
            const userId = authStore.userId
            if (!userId) {
                console.error('User not authenticated')
                return false
            }

            const year = dateStore.currentDate.getFullYear()
            const month = dateStore.currentDate.getMonth()
            const day = dateStore.currentDate.getDate()
            const startTime = new Date(year, month, day, hours, minutes)
            const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000)

            await db.tasks.create({
                user_id: userId,
                title: form.title,
                description: form.description,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                completed: false,
                category: form.category,
            })

            // 保存本次使用的时间和时长
            lastUsedTime.value = form.time
            lastUsedDuration.value = durationValue

            await fetchTasks({ showLoading: false })
            return true
        } catch (e) {
            console.error('Failed to quick add task', e)
            return false
        } finally {
            isSubmitting.value = false
        }
    })

    return {
        form,
        quickSubmit,
        isSubmitting
    }
}
