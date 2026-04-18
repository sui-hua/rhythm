/**
 * ============================================
 * Day 视图模态框控制 (views/day/composables/useDayModal.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理添加/编辑任务模态框的状态
 * - 控制模态框的打开/关闭
 * - 获取当前编辑的任务数据
 *
 * 【状态管理】
 * - showAddModal → 模态框显示/隐藏
 * - editingTaskIndex → 当前编辑的任务索引
 * - editingTask → 当前编辑的任务对象
 *
 * 【操作方法】
 * - openAddModal() → 打开新增模态框
 * - openEditModal(index) → 打开编辑模态框
 */
/**
 * ============================================
 * Day 视图模态框控制 (views/day/composables/useDayModal.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理添加/编辑任务的模态框状态
 * - 提供 editingTask 计算属性
 *
 * 【状态管理】
 * - showAddModal → 模态框显示/隐藏
 * - editingTaskIndex → 当前编辑的任务索引
 * - editingTask → 当前编辑的任务对象（从 dailySchedule 计算）
 *
 * 【操作方法】
 * - openAddModal() → 打开发送模态框（无初始数据）
 * - openEditModal(index) → 打开编辑模态框（带初始数据）
 */
import { ref, computed } from 'vue'
import { useDayData } from './useDayData'

/**
 * Day 视图模态框控制层 (Composable)
 * 托管”新建/编辑”对话框的状态和数据
 */
export function useDayModal() {
    const { dailySchedule } = useDayData()
    const showAddModal = ref(false)
    const editingTaskIndex = ref(null)

    const editingTask = computed(() => {
        if (editingTaskIndex.value !== null && dailySchedule.value) {
            return dailySchedule.value[editingTaskIndex.value]
        }
        return null
    })

    const openAddModal = () => {
        editingTaskIndex.value = null
        showAddModal.value = true
    }

    const openEditModal = (index) => {
        editingTaskIndex.value = index
        showAddModal.value = true
    }

    return {
        showAddModal,
        editingTaskIndex,
        editingTask,
        openAddModal,
        openEditModal
    }
}
