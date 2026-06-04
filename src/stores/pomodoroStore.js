import { defineStore } from 'pinia'
import { ref, computed, onScopeDispose } from 'vue'

export const usePomodoroStore = defineStore('pomodoro', () => {
    const activeTask = ref(null)
    const showModal = ref(false)

    // 全局计时器状态，用于驱动 elapsedSeconds 每秒刷新
    const timer = ref(null)
    const now = ref(Date.now())

    const elapsedSeconds = computed(() => {
        if (!activeTask.value || !activeTask.value.actual_start_time) return 0
        const start = new Date(activeTask.value.actual_start_time).getTime()
        return Math.max(0, Math.floor((now.value - start) / 1000))
    })

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
        // 组件卸载时自动清理定时器，防止内存泄漏
        onScopeDispose(() => {
            if (timer.value) {
                clearInterval(timer.value)
                timer.value = null
            }
        })
    }

    const stopTimer = () => {
        if (timer.value) {
            clearInterval(timer.value)
            timer.value = null
        }
    }

    const setActiveTask = (task) => {
        activeTask.value = task
        showModal.value = true
        startTimer()
    }

    const reset = () => {
        activeTask.value = null
        showModal.value = false
        stopTimer()
    }

    // 仅关闭模态框，计时器继续运行
    const closeModal = () => {
        showModal.value = false
    }

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
        stopTimer,
        stop: stopTimer
    }
})
