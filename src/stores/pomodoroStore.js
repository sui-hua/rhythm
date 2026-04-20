/**
 * ============================================
 * 番茄钟状态管理 (stores/pomodoroStore.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理番茄钟/任务计时器状态
 * - 记录当前正在计时的任务
 * - 提供计时模态框的显示/隐藏控制
 *
 * 【数据结构】
 * - activeTask: 当前计时任务
 * - showModal: 计时模态框是否显示
 * - elapsedSeconds: 已用时间（秒）
 * - formattedTime: 格式化后的时间显示
 *
 * 【计时流程】
 * - setActiveTask() → 开始计时，弹出模态框
 * - reset()         → 关闭模态框，重置状态
 * - closeModal()    → 仅关闭模态框，继续后台计时
 * - openModal()     → 重新打开模态框
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 番茄钟全局状态管理 (Pomodoro Store)
 * 记录当前正在进行计时的任务，并管理全局的唯一计时器。
 *
 * @description 使用 Pinia Composition API 模式管理番茄钟计时状态。
 *              同一时间只能有一个活跃任务，支持模态框的显示/隐藏控制。
 *              计时器每秒更新已用时间，支持后台计时模式。
 */
export const usePomodoroStore = defineStore('pomodoro', () => {
    // 当前活跃的任务对象
    const activeTask = ref(null)
    // 计时模态框是否显示
    const showModal = ref(false)

    // 全局计时器状态
    const timer = ref(null)
    const now = ref(Date.now())

    /**
     * 计算已用时间（秒）
     *
     * @description 根据 activeTask.actual_start_time 计算自任务开始以来的秒数。
     *              如果没有活跃任务或任务无开始时间，返回 0。
     *              时间戳取自全局 now ref，确保响应式更新。
     *
     * @returns {number} 已用时间秒数，最小值为 0
     */
    const elapsedSeconds = computed(() => {
        if (!activeTask.value || !activeTask.value.actual_start_time) return 0
        const start = new Date(activeTask.value.actual_start_time).getTime()
        return Math.max(0, Math.floor((now.value - start) / 1000))
    })

    /**
     * 格式化时间显示
     *
     * @description 将 elapsedSeconds 转换为人类可读的时间字符串。
     *              格式：
     *              - 超过 1 小时：HH:MM:SS
     *              - 不足 1 小时：MM:SS
     *              使用 0 填充确保两位数显示。
     *
     * @returns {string} 格式化后的时间字符串，如 "01:30:45" 或 "45:30"
     */
    const formattedTime = computed(() => {
        const total = elapsedSeconds.value
        const h = Math.floor(total / 3600)
        const m = Math.floor((total % 3600) / 60)
        const s = total % 60
        
        if (h > 0) {
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    })

    /**
     * 启动全局计时器
     *
     * @description 启动一个每秒更新一次的 interval，刷新 now ref 值。
     *              启动前先清除已有的 timer，避免重复计时。
     *              主要供 setActiveTask 内部调用，也支持外部手动调用。
     *
     * @returns {void}
     */
    const startTimer = () => {
        if (timer.value) clearInterval(timer.value)
        now.value = Date.now()
        timer.value = setInterval(() => {
            now.value = Date.now()
        }, 1000)
    }

    /**
     * 停止全局计时器
     *
     * @description 清除 interval 并将 timer 置为 null。
     *              安全调用：即使没有运行中的 timer 也不会报错。
     *              主要供 reset 内部调用，也支持外部手动调用。
     *
     * @returns {void}
     */
    const stopTimer = () => {
        if (timer.value) {
            clearInterval(timer.value)
            timer.value = null
        }
    }

    /**
     * 设置活跃任务并弹出计时模态框
     *
     * @description 开始对一个任务进行计时。操作步骤：
     *              1. 将传入的任务对象赋值给 activeTask
     *              2. 显示计时模态框 (showModal = true)
     *              3. 启动全局计时器
     *
     *              通常在用户点击"开始计时"按钮时调用。
     *
     * @param {Object} task - 要计时的任务对象，应包含 actual_start_time 字段
     * @param {string} task.actual_start_time - 任务实际开始时间（ISO 字符串）
     * @returns {void}
     */
    const setActiveTask = (task) => {
        activeTask.value = task
        showModal.value = true
        startTimer()
    }

    /**
     * 重置番茄钟状态
     *
     * @description 完全关闭番茄钟，流程：
     *              1. 清除活跃任务 (activeTask = null)
     *              2. 关闭模态框 (showModal = false)
     *              3. 停止全局计时器
     *
     *              用于计时结束或用户主动取消时调用。
     *
     * @returns {void}
     */
    const reset = () => {
        activeTask.value = null
        showModal.value = false
        stopTimer()
    }

    /**
     * 仅关闭模态框（继续后台计时）
     *
     * @description 隐藏计时模态框，但保持：
     *              - activeTask 不变（任务继续计时）
     *              - 计时器继续运行
     *
     *              用于用户暂时隐藏模态框但不想中断计时时调用。
     *
     * @returns {void}
     */
    const closeModal = () => {
        showModal.value = false
    }

    /**
     * 重新打开计时模态框
     *
     * @description 检查是否有活跃任务，如有则重新显示模态框。
     *              如果没有活跃任务则不做任何操作。
     *
     *              通常在用户点击托盘图标或通知时调用，恢复已打开的计时界面。
     *
     * @returns {void}
     */
    const openModal = () => {
        if (activeTask.value) {
            showModal.value = true
        }
    }

    return {
        activeTask,
        showModal,
        elapsedSeconds,
        formattedTime,
        setActiveTask,
        reset,
        closeModal,
        openModal,
        startTimer,
        stopTimer
    }
})
