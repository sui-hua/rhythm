import { ref, reactive, watch, computed } from 'vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { useDateStore } from '@/stores/dateStore'
import { useDayData } from './useDayData'
import { useActionFeedback } from './useActionFeedback'
import { withLoadingLock } from '@/utils/throttle'

export function useAddEventForm(props, emit) {
    const authStore = useAuthStore()
    const dateStore = useDateStore()
    const { fetchTasks } = useDayData()
    const { success, error } = useActionFeedback()

    /**
     * 写操作（提交/删除）按钮的 loading 状态
     * 防止用户重复点击导致数据重复提交
     * @type {import('vue').Ref<boolean>}
     */
    const isSubmitting = ref(false)

    /**
     * 判断当前编辑的项目是否为习惯类型
     * 习惯与普通任务在数据结构和提交逻辑上有差异
     * @type {import('vue').ComputedRef<boolean>}
     */
    const isHabit = computed(() => props.initialData?.type === 'habit')

    /**
     * 表单数据模型（响应式）
     * 用于绑定表单输入元素，支持双向数据绑定
     * @type {Object}
     * @property {string} form.title - 事件标题
     * @property {string} form.time - 开始时间（HH:mm 格式）
     * @property {number} form.duration - 持续时长（小时，数值如 1.5）
     * @property {string} form.category - 事件分类（如 '工作'、'学习'）
     * @property {string} form.description - 事件详细描述
     */
    const form = reactive({
        title: '',
        time: '',
        duration: 1.0,
        category: '工作',
        description: ''
    })

    const touched = reactive({
        title: false,
        time: false,
        duration: false
    })

    const markAllTouched = () => {
        Object.keys(touched).forEach((field) => {
            touched[field] = true
        })
    }

    const resetTouched = () => {
        Object.keys(touched).forEach((field) => {
            touched[field] = false
        })
    }

    const touchField = (field) => {
        if (field in touched) touched[field] = true
    }

    let lastUsedTime = '08:00'

    watch(() => props.show, (newShow) => {
        if (!newShow) return
        resetTouched()

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
    })

    const validationRules = {
        title: (v) => v.trim() ? '' : '任务名称不能为空',
        time: (v) => v ? '' : '开始时间不能为空',
        duration: (v) => {
            const num = parseFloat(v)
            if (isNaN(num) || num <= 0) return '时长必须大于0'
            return ''
        }
    }

    const validationErrors = computed(() => ({
        title: validationRules.title(form.title),
        time: validationRules.time(form.time),
        duration: validationRules.duration(form.duration)
    }))

    const errors = computed(() => ({
        title: touched.title ? validationErrors.value.title : '',
        time: touched.time ? validationErrors.value.time : '',
        duration: touched.duration ? validationErrors.value.duration : ''
    }))

    const isValid = computed(() => {
        return !validationErrors.value.title && !validationErrors.value.time && !validationErrors.value.duration
    })

    const submit = withLoadingLock(async () => {
        if (!isValid.value) {
            markAllTouched()
            return
        }

        isSubmitting.value = true
        const [hours, minutes] = form.time.split(':').map(Number)
        const durationValue = parseFloat(form.duration)

        try {
            if (props.initialData) {
                // ========================================
                // 编辑模式：更新已有数据
                // ========================================
                if (isHabit.value) {
                    // 习惯类型：更新习惯表（标题、时间、时长）
                    const taskTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    await db.habit.update(props.initialData.id, {
                        title: form.title,
                        task_time: taskTimeStr,
                        duration: Math.round(durationValue * 60) || 10  // 转换为分钟存储
                    })
                } else {
                    // 普通任务：更新任务表（完整时间范围、描述）
                    const year = dateStore.currentDate.getFullYear()
                    const month = dateStore.currentDate.getMonth()
                    const day = dateStore.currentDate.getDate()
                    const startTime = new Date(year, month, day, hours, minutes)
                    const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000)

                    await db.task.update(props.initialData.id, {
                        title: form.title,
                        description: form.description,
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString()
                    })
                }
            } else {
                // ========================================
                // 新建模式：创建新数据
                // ========================================
                lastUsedTime = form.time  // 记住本次使用的时间
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

                await db.task.create({
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
            success(props.initialData ? '更新成功' : '创建成功')
        } catch (e) {
            error('保存失败', e)
        } finally {
            isSubmitting.value = false
        }
    })

    const handleDelete = withLoadingLock(async () => {
        if (props.initialData) {
            isSubmitting.value = true
            try {
                if (isHabit.value) {
                    await db.habit.delete(props.initialData.id)
                } else {
                    await db.task.delete(props.initialData.id)
                }
                await fetchTasks({ showLoading: false })
                emit('update:show', false)
                success('删除成功')
            } catch (e) {
                error('删除失败', e)
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
        isSubmitting,
        touchField
    }
}
