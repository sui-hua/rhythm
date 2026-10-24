import { reactive, watch, computed } from 'vue'
import type { ComputedRef } from 'vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { useDateStore } from '@/stores/dateStore'
import { useDayStore } from '@/stores/dayStore'
import { useActionFeedback } from './useActionFeedback'
import { useActionLock } from '@/composables/useActionLock'
import { confirmDelete } from '@/composables/useDeleteConfirm'

/** 编辑模式下的初始数据（来自日程项） */
export interface InitialEventData {
    id: string
    type?: string
    title?: string
    time?: string
    duration?: string
    rawDuration?: number
    category?: string
    description?: string
}

/** 组件 props 类型 */
export interface AddEventFormProps {
    show: boolean
    initialData?: InitialEventData | null
    categories?: string[]
}

/** 组件 emits 类型 */
export type AddEventFormEmit = {
    (event: 'close' | 'refresh'): void
    (event: 'update:show', value: boolean): void
}

/** 表单数据结构 */
interface EventFormData {
    title: string
    time: string
    duration: number
    category: string
    description: string
}

/** 触摸过的字段标记 */
interface TouchedFields {
    title: boolean
    time: boolean
    duration: boolean
}

/** 验证错误结构 */
interface ValidationErrors {
    title: string
    time: string
    duration: string
}

/**
 * 添加/编辑事件表单 composable
 * 处理表单数据、校验、提交、删除等逻辑
 */
export function useAddEventForm(props: AddEventFormProps, emit: AddEventFormEmit) {
    const authStore = useAuthStore()
    const dateStore = useDateStore()
    const dayStore = useDayStore()
    const { success, error } = useActionFeedback()
    const { isSubmitting, withLock } = useActionLock()

    // 判断当前编辑的项目是否为习惯类型
    const isHabit: ComputedRef<boolean> = computed(() => props.initialData?.type === 'habit')
    // 判断当前编辑的项目是否为目标任务类型，避免误写到 task 表
    const isGoalDay: ComputedRef<boolean> = computed(() => props.initialData?.type === 'goal_day')

    // 表单数据模型（响应式）
    const eventForm: EventFormData = reactive({
        title: '',
        time: '',
        duration: 1.0,
        category: '工作',
        description: ''
    })

    // 字段触摸标记，用于控制校验错误的显示时机
    const touchedFields: TouchedFields = reactive({
        title: false,
        time: false,
        duration: false
    })

    // 标记所有字段为已触摸（提交校验失败时使用）
    const markAllFieldsTouched = () => {
        ;(Object.keys(touchedFields) as Array<keyof TouchedFields>).forEach((field) => {
            touchedFields[field] = true
        })
    }

    // 重置所有字段触摸标记
    const resetTouchedFields = () => {
        ;(Object.keys(touchedFields) as Array<keyof TouchedFields>).forEach((field) => {
            touchedFields[field] = false
        })
    }

    // 标记单个字段为已触摸
    const markFieldTouched = (field: keyof TouchedFields) => {
        if (field in touchedFields) touchedFields[field] = true
    }

    // 记住上次使用的时间槽，新建时复用
    let lastUsedTimeSlot = '08:00'

    // 监听弹窗显示状态，打开时初始化表单数据
    watch(() => props.show, (newShow) => {
        if (!newShow) return
        resetTouchedFields()

        if (props.initialData) {
            eventForm.title = props.initialData.title || ''
            eventForm.time = props.initialData.time || ''

            let durationVal: number
            if (props.initialData.rawDuration !== undefined) {
                durationVal = props.initialData.rawDuration
            } else {
                const durationStr = props.initialData.duration || '1.0H'
                durationVal = parseFloat(String(durationStr).replace('H', ''))
            }

            eventForm.duration = durationVal
            eventForm.category = props.initialData.category || '工作'
            eventForm.description = props.initialData.description || ''
        } else {
            eventForm.title = ''
            eventForm.time = lastUsedTimeSlot
            eventForm.duration = 0.5
            eventForm.category = '工作'
            eventForm.description = ''
        }
    })

    // 校验规则：返回空字符串表示通过，否则返回错误消息
    const validationRules = {
        title: (v: string) => v.trim() ? '' : '任务名称不能为空',
        time: (v: string) => v ? '' : '开始时间不能为空',
        duration: (v: number | string) => {
            const num = parseFloat(String(v))
            if (isNaN(num) || num <= 0) return '时长必须大于0'
            return ''
        }
    }

    // 所有字段的校验结果（不考虑触摸状态）
    const validationErrors: ComputedRef<ValidationErrors> = computed(() => ({
        title: validationRules.title(eventForm.title),
        time: validationRules.time(eventForm.time),
        duration: validationRules.duration(eventForm.duration)
    }))

    // 仅显示已触摸字段的校验错误
    const errors: ComputedRef<ValidationErrors> = computed(() => ({
        title: touchedFields.title ? validationErrors.value.title : '',
        time: touchedFields.time ? validationErrors.value.time : '',
        duration: touchedFields.duration ? validationErrors.value.duration : ''
    }))

    // 表单是否整体有效
    const isValid: ComputedRef<boolean> = computed(() => {
        return !validationErrors.value.title && !validationErrors.value.time && !validationErrors.value.duration
    })

    // 提交表单：新建或更新
    const submit = withLock(async () => {
        if (!isValid.value) {
            markAllFieldsTouched()
            return
        }

        // 校验时间格式是否合法
        const timeParts = eventForm.time.split(':')
        const hours = parseInt(timeParts[0] ?? '0', 10)
        const minutes = parseInt(timeParts[1] ?? '0', 10)
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            error('时间格式无效')
            return
        }
        const durationValue = parseFloat(String(eventForm.duration))

        try {
            if (props.initialData) {
                // ========================================
                // 编辑模式：更新已有数据
                // ========================================
                if (isHabit.value) {
                    // 习惯类型：更新习惯表（标题、时间、时长）
                    const taskTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    await db.habit.update(props.initialData.id, {
                        title: eventForm.title,
                        task_time: taskTimeStr,
                        duration: Math.round(durationValue * 60) || 10  // 转换为分钟存储
                    })
                } else if (isGoalDay.value) {
                    // 目标任务：更新 goal_days 表，保留原有日期与状态，只修改展示内容和时间
                    const taskTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    await db.goalDays.update(props.initialData.id, {
                        title: eventForm.title,
                        description: eventForm.description,
                        task_time: taskTimeStr,
                        duration: Math.round(durationValue * 60) || 10
                    })
                } else {
                    // 普通任务：更新任务表（完整时间范围、描述）
                    const year = dateStore.currentDate.getFullYear()
                    const month = dateStore.currentDate.getMonth()
                    const day = dateStore.currentDate.getDate()
                    const startTime = new Date(year, month, day, hours, minutes)
                    const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000)

                    await db.task.update(props.initialData.id, {
                        title: eventForm.title,
                        description: eventForm.description,
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString()
                    })
                }
            } else {
                // ========================================
                // 新建模式：创建新数据
                // ========================================
                lastUsedTimeSlot = eventForm.time  // 记住本次使用的时间槽
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
                    title: eventForm.title,
                    description: eventForm.description,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    completed: false,
                })
            }
            await dayStore.fetchTasks({ showLoading: false })
            emit('update:show', false)
            success(props.initialData ? '更新成功' : '创建成功')
        } catch (e) {
            error('保存失败', e)
        }
    })

    // 删除任务/习惯
    const handleDelete = withLock(async () => {
        if (props.initialData) {
            if (!confirmDelete(isHabit.value ? 'habit' : 'task')) return

            try {
                if (isHabit.value) {
                    await db.habit.delete(props.initialData.id)
                } else if (isGoalDay.value) {
                    await db.goalDays.delete(props.initialData.id)
                } else {
                    await db.task.delete(props.initialData.id)
                }
                await dayStore.fetchTasks({ showLoading: false })
                emit('update:show', false)
                success('删除成功')
            } catch (e) {
                error('删除失败', e)
            }
        }
    })

    return {
        eventForm,
        isHabit,
        isGoalDay,
        errors,
        isValid,
        submit,
        handleDelete,
        isSubmitting,
        markFieldTouched
    }
}
