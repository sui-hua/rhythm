/**
 * @fileOverview AddEventModal 表单逻辑层 (Composable)
 * 
 * 负责管理「新建/编辑事件」弹窗的全部表单逻辑，包括：
 * - 表单状态管理（响应式数据模型）
 * - 数据回显（编辑时填充已有数据）
 * - 表单验证（实时校验与错误提示）
 * - 新建/编辑/删除事件的数据库操作
 * 
 * @module useAddEventForm
 * @requires vue
 * @requires @/services/database
 * @requires @/stores/authStore
 * @requires @/stores/dateStore
 * @requires ./useDayData
 * @requires ./useActionFeedback
 * @requires @/utils/throttle
 */

import { ref, reactive, watch, computed } from 'vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { useDateStore } from '@/stores/dateStore'
import { useDayData } from './useDayData'
import { useActionFeedback } from './useActionFeedback'
import { withLoadingLock } from '@/utils/throttle'

/**
 * AddEventModal 表单逻辑组合函数
 * 
 * @description 管理日程/任务/习惯的创建与编辑表单状态与业务逻辑。
 * 支持两种数据模型：
 * - **Task（任务）**：包含时间范围（start_time ~ end_time）、描述、分类
 * - **Habit（习惯）**：仅需标题、时间（task_time）和时长（duration），按固定周期重复
 * 
 * @param {Object} props - 从父组件传入的 props
 * @param {boolean} props.show - 弹窗显示/隐藏状态
 * @param {Object|null} props.initialData - 初始数据（编辑时传入，新建时为 null）
 * @param {string} [props.initialData.id] - 数据的唯一标识
 * @param {string} [props.initialData.type] - 数据类型，'habit' 表示习惯，否则为普通任务
 * @param {string} [props.initialData.title] - 事件标题
 * @param {string} [props.initialData.time] - 开始时间（HH:mm 格式）
 * @param {string|number} [props.initialData.duration] - 时长（支持 '1.5H' 格式或数字）
 * @param {number} [props.initialData.rawDuration] - 时长（原始数字，如 1.5）
 * @param {string} [props.initialData.category] - 分类（如 '工作'、'学习'）
 * @param {string} [props.initialData.description] - 事件描述
 * 
 * @param {Object} emit - Vue 组件 emit 实例，用于向父组件通信
 * @param {Function} emit.update:show - 触发弹窗关闭事件
 * 
 * @returns {Object} 表单相关的状态与方法
 * @returns {Object} returns.form - 表单数据对象（响应式）
 * @returns {boolean} returns.isHabit - 当前编辑项是否为习惯类型
 * @returns {Object} returns.errors - 各字段实时验证错误信息
 * @returns {boolean} returns.isValid - 表单整体是否通过验证
 * @returns {Function} returns.submit - 提交表单（新建或更新数据）
 * @returns {Function} returns.handleDelete - 删除当前编辑项
 * @returns {boolean} returns.isSubmitting - 提交/删除操作进行中的 loading 状态
 */
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

    /**
     * 记忆上一次新建事件时使用的时间
     * 下次新建时会自动回填该时间，提升连续创建效率
     * @type {string}
     */
    let lastUsedTime = '08:00'

    /**
     * 监听弹窗显示状态，自动回显或重置表单数据
     * 
     * - 当弹窗打开（show = true）且存在 initialData 时：将表单填充为编辑数据
     * - 当弹窗打开但无 initialData 时：重置为空白表单（新建模式）
     * 
     * 使用 `immediate: true` 确保组件挂载时首次渲染也触发初始化
     * 
     * @param {import('vue').WatchSource<boolean>} () => props.show - 监听弹窗显示状态
     * @param {Function} callback - 弹窗显示状态变化时的回调
     * @param {boolean} newShow - 新的显示状态
     */
    watch(() => props.show, (newShow) => {
        if (newShow) {
            resetTouched()

            if (props.initialData) {
                // ========================================
                // 编辑模式：回显已有数据
                // ========================================
                form.title = props.initialData.title || ''
                form.time = props.initialData.time || ''

                // 解析时长字段，支持 rawDuration（数字）和 duration（字符串如 '1.5H'）
                let durationVal
                if (props.initialData.rawDuration !== undefined) {
                    // 优先使用 rawDuration（直接数字，如 1.5）
                    durationVal = props.initialData.rawDuration
                } else {
                    // 否则尝试解析字符串格式（如 '1.5H' → 1.5）
                    const durationStr = props.initialData.duration || '1.0H'
                    durationVal = parseFloat(String(durationStr).replace('H', ''))
                }

                form.duration = durationVal
                form.category = props.initialData.category || '工作'
                form.description = props.initialData.description || ''
            } else {
                // ========================================
                // 新建模式：重置为默认值
                // ========================================
                form.title = ''
                form.time = lastUsedTime  // 复用上次使用的时间
                form.duration = 0.5
                form.category = '工作'
                form.description = ''
            }
        }
    }, { immediate: true })

    /**
     * 表单字段验证规则
     * 定义每个必填字段的校验逻辑，返回空字符串表示通过，否则返回错误信息
     * 
     * @type {Object.<string, Function>}
     */
    const validationRules = {
        /**
         * 标题验证：不能为空
         * @param {string} v - 表单标题值
         * @returns {string} 空字符串表示通过，错误信息表示失败
         */
        title: (v) => v.trim() ? '' : '任务名称不能为空',
        
        /**
         * 时间验证：不能为空
         * @param {string} v - 表单时间值
         * @returns {string} 空字符串表示通过，错误信息表示失败
         */
        time: (v) => v ? '' : '开始时间不能为空',
        
        /**
         * 时长验证：必须为大于 0 的数字
         * @param {string|number} v - 表单时长值
         * @returns {string} 空字符串表示通过，错误信息表示失败
         */
        duration: (v) => {
            const num = parseFloat(v)
            if (isNaN(num) || num <= 0) return '时长必须大于0'
            return ''
        }
    }

    /**
     * 计算属性：实时验证错误信息
     * 每次 form 相关字段变化时自动重新计算
     * 
     * @type {import('vue').ComputedRef<Object>}
     */
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

    /**
     * 计算属性：表单整体是否通过验证
     * 当所有字段均无错误时返回 true
     * 
     * @type {import('vue').ComputedRef<boolean>}
     */
    const isValid = computed(() => {
        return !validationErrors.value.title && !validationErrors.value.time && !validationErrors.value.duration
    })

    /**
     * 提交表单（新建或编辑）
     * 
     * 根据 props.initialData 是否存在判断操作类型：
     * - **有 initialData**：执行更新（Update）操作
     *   - isHabit = true：更新 db.habit 记录
     *   - isHabit = false：更新 db.task 记录
     * - **无 initialData**：执行新建（Create）操作，创建 db.task 记录
     * 
     * 提交成功后：
     * 1. 刷新当前日期的任务列表（fetchTasks）
     * 2. 关闭弹窗（emit 'update:show'）
     * 3. 显示操作成功提示
     * 
     * @async
     * @returns {Promise<void>}
     */
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

    /**
     * 删除当前编辑的项目
     * 
     * 根据 isHabit 判断删除目标表：
     * - isHabit = true：删除 db.habit 中的记录
     * - isHabit = false：删除 db.task 中的记录
     * 
     * 删除成功后刷新列表并关闭弹窗
     * 
     * @async
     * @returns {Promise<void>}
     */
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
