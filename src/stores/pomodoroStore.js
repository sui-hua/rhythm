import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 番茄钟全局状态管理 (Pomodoro Store)
 * 记录当前正在进行计时的任务，并控制计时模态框的弹出。
 */
export const usePomodoroStore = defineStore('pomodoro', () => {
    // 当前活跃的任务对象
    const activeTask = ref(null)
    // 计时模态框是否显示
    const showModal = ref(false)

    /**
     * 设置活跃任务并弹出模态框
     */
    const setActiveTask = (task) => {
        activeTask.value = task
        showModal.value = true
    }

    /**
     * 关闭模态框并重置活跃任务
     */
    const reset = () => {
        activeTask.value = null
        showModal.value = false
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
        setActiveTask,
        reset,
        closeModal,
        openModal
    }
})
