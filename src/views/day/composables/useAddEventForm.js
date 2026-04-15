import { ref, reactive, watch, computed } from 'vue'
import { safeDb as db } from '@/services/safeDb'
import { useAuthStore } from '@/stores/authStore'
import { useDateStore } from '@/stores/dateStore'
import { useDayData } from './useDayData'
import { withLoadingLock } from '@/utils/throttle'

/**
 * AddEventModal 表单逻辑层 (Composable)
 * 管理表单状态、数据回显、提交和删除操作
 */
export function useAddEventForm(props, emit) {
    const authStore = useAuthStore()
    const dateStore = useDateStore()
    const { fetchTasks } = useDayData()

    // 写操作按钮 loading 状态
    const isSubmitting = ref(false)

    // 判断当前编辑的项目是否为习惯类型
    const isHabit = computed(() => props.initialData?.type === 'habit')

    const form = reactive({
        title: '',
        time: '',
        duration: 1.0,
        category: '工作',
        description: ''
    })

    let lastUsedTime = '08:00'

    // 监听弹窗显示状态，自动回显或重置表单
    watch(() => props.show, (newShow) => {
        if (newShow) {
            if (props.initialData) {
                form.title = props.initialData.title || ''
                form.time = props.initialData.time || ''

                let durationVal
                if (props.initialData.rawDuration !== undefined) {
                    durationVal = props.initialData.rawDuration
                } else {
                    const durationStr = props.initialData.duration || '1.0H'
                    durationVal = parseFloat(String(durationStr).replace('H', ''))
                }

                form.duration = durationVal
                form.category = props.initialData.category || '工作'
                form.description = props.initialData.description || ''
            } else {
                form.title = ''
                form.time = lastUsedTime
                form.duration = 0.5
                form.category = '工作'
                form.description = ''
            }
        }
    }, { immediate: true })

    // 验证规则
    const validationRules = {
        title: (v) => v.trim() ? '' : '任务名称不能为空',
        time: (v) => v ? '' : '开始时间不能为空',
        duration: (v) => {
            const num = parseFloat(v)
            if (isNaN(num) || num <= 0) return '时长必须大于0'
            return ''
        }
    }

    // 计算属性：实时验证错误信息
    const errors = computed(() => ({
        title: validationRules.title(form.title),
        time: validationRules.time(form.time),
        duration: validationRules.duration(form.duration)
    }))

    // 计算属性：表单是否有效
    const isValid = computed(() => {
        return !errors.value.title && !errors.value.time && !errors.value.duration
    })

    // 提交表单（新建或编辑）
    const submit = withLoadingLock(async () => {
        if (!isValid.value) return

        isSubmitting.value = true
        const [hours, minutes] = form.time.split(':').map(Number)
        const durationValue = parseFloat(form.duration)

        try {
            if (props.initialData) {
                if (isHabit.value) {
                    const taskTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    await db.habits.update(props.initialData.id, {
                        title: form.title,
                        task_time: taskTimeStr,
                        duration: Math.round(durationValue * 60) || 10
                    })
                } else {
                    const year = dateStore.currentDate.getFullYear()
                    const month = dateStore.currentDate.getMonth()
                    const day = dateStore.currentDate.getDate()
                    const startTime = new Date(year, month, day, hours, minutes)
                    const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000)

                    await db.tasks.update(props.initialData.id, {
                        title: form.title,
                        description: form.description,
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString()
                    })
                }
            } else {
                lastUsedTime = form.time
                const userId = authStore.userId
                if (!userId) {
                    console.error('User not authenticated')
                    return
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
                })
            }
            await fetchTasks({ showLoading: false })
            emit('update:show', false)
        } catch (e) {
            console.error('Failed to save', e)
        } finally {
            isSubmitting.value = false
        }
    })

    // 删除当前编辑的项目
    const handleDelete = withLoadingLock(async () => {
        if (props.initialData) {
            isSubmitting.value = true
            try {
                if (isHabit.value) {
                    await db.habits.delete(props.initialData.id)
                } else {
                    await db.tasks.delete(props.initialData.id)
                }
                await fetchTasks({ showLoading: false })
                emit('update:show', false)
            } catch (e) {
                console.error('Failed to delete', e)
            } finally {
                isSubmitting.value = false
            }
        }
    })

    return {
        form,
        isHabit,
        errors,
        isValid,
        submit,
        handleDelete,
        isSubmitting
    }
}
