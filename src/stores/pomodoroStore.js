import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 番茄钟全局状态管理 (Pomodoro Store)
 * 记录当前正在进行计时的任务，并管理全局的唯一计时器。
 */
export const usePomodoroStore = defineStore('pomodoro', () => {
    // 当前活跃的任务对象
    const activeTask = ref(null)
    // 计时模态框是否显示
    const showModal = ref(false)

    // 全局计时器状态
    const timer = ref(null)
    const now = ref(Date.now())

    // 计算已用时间（秒）
    const elapsedSeconds = computed(() => {
        if (!activeTask.value || !activeTask.value.actual_start_time) return 0
        const start = new Date(activeTask.value.actual_start_time).getTime()
        return Math.max(0, Math.floor((now.value - start) / 1000))
    })

    // 格式化时间显示
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

    const startTimer = () => {
        if (timer.value) clearInterval(timer.value)
        now.value = Date.now()
        timer.value = setInterval(() => {
            now.value = Date.now()
        }, 1000)
    }

    const stopTimer = () => {
        if (timer.value) {
            clearInterval(timer.value)
            timer.value = null
        }
    }

    /**
     * 设置活跃任务并弹出模态框
     */
    const setActiveTask = (task) => {
        activeTask.value = task
        showModal.value = true
        startTimer()
    }

    /**
     * 关闭模态框并重置活跃任务
     */
    const reset = () => {
        activeTask.value = null
        showModal.value = false
        stopTimer()
    }

    /**
     * 仅关闭模态框，不重置计时（允许后台计时）
     */
    const closeModal = () => {
        showModal.value = false
    }

    /**
     * 再次打开正在进行的计时模态框
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
