/**
 * ============================================
 * Day 视图模态框控制 (views/day/composables/useDayModal.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理 Day 视图中"添加/编辑任务"模态框的状态
 * - 提供打开/关闭模态框的方法
 * - 提供当前编辑任务的计算属性
 *
 * 【状态管理】
 * - showAddModal → 模态框显示/隐藏状态 (ref<boolean>)
 * - editingTaskIndex → 当前编辑任务在 dailySchedule 中的索引，null 表示新增模式
 * - editingTask → 根据 editingTaskIndex 计算出的当前编辑任务对象
 *
 * 【操作方法】
 * - openAddModal() → 打开新增模态框（无初始数据，editingTaskIndex 置为 null）
 * - openEditModal(index) → 打开编辑模态框（携带索引对应的任务数据）
 *
 * 【与 useDayData 配合】
 * - 通过 useDayData() 获取 dailySchedule（当日任务列表）
 * - editingTask 从 dailySchedule 中通过索引取出对应的任务对象
 */
import { ref, computed } from 'vue'
import { useDayData } from './useDayData'

/**
 * Day 视图模态框控制层 (Composable)
 * 托管"新建/编辑任务"对话框的状态和数据
 *
 * @description
 * 该 Composable 负责管理任务模态框的显示状态和编辑上下文：
 * - `showAddModal`: 控制模态框的显示/隐藏
 * - `editingTaskIndex`: 标记当前编辑的任务索引，null 表示新增模式
 * - `editingTask`: 根据索引从日计划中计算得出的任务对象，用于表单回填
 *
 * @returns {Object} 包含状态和方法的对象
 * @returns {import('vue').Ref<boolean>} returns.showAddModal - 模态框显示状态
 * @returns {import('vue').Ref<number|null>} returns.editingTaskIndex - 当前编辑任务索引
 * @returns {import('vue').ComputedRef<Object|null>} returns.editingTask - 当前编辑任务对象
 * @returns {Function} returns.openAddModal - 打开新增模态框
 * @returns {Function} returns.openEditModal - 打开编辑模态框
 */
export function useDayModal() {
    /** @type {import('vue').ReactiveOrRef<{dailySchedule: import('vue').Ref<Array>} */
    const { dailySchedule } = useDayData()

    /** @type {import('vue').Ref<boolean>} 模态框显示/隐藏状态 */
    const showAddModal = ref(false)

    /** @type {import('vue').Ref<number|null>} 当前编辑任务在 dailySchedule 中的索引，null 表示新增模式 */
    const editingTaskIndex = ref(null)

    /**
     * 根据 editingTaskIndex 计算当前编辑的任务对象
     * - 当 editingTaskIndex 为 null 时，返回 null（新增模式）
     * - 当 editingTaskIndex 有效且 dailySchedule 存在时，返回对应任务
     *
     * @type {import('vue').ComputedRef<Object|null>}
     */
    const editingTask = computed(() => {
        if (editingTaskIndex.value !== null && dailySchedule.value) {
            return dailySchedule.value[editingTaskIndex.value]
        }
        return null
    })

    /**
     * 打开新增任务模态框
     * - 将 editingTaskIndex 重置为 null，表示新增模式
     * - 显示模态框
     *
     * @description
     * 调用此方法后，editingTask 为 null，模态框表单应为空白的输入状态
     */
    const openAddModal = () => {
        editingTaskIndex.value = null
        showAddModal.value = true
    }

    /**
     * 打开编辑任务模态框
     * - 设置 editingTaskIndex 为指定索引，表示编辑模式
     * - 显示模态框，表单将回填对应任务的数据
     *
     * @param {number} index - 任务在 dailySchedule 中的索引
     *
     * @description
     * 调用此方法后，editingTask 将返回 dailySchedule[index] 的任务对象，
     * 模态框表单会显示该任务的现有数据供用户编辑
     */
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
