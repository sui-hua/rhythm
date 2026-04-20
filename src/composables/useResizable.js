/**
 * useResizable - 可拖拽调整宽度的 Composables
 *
 * 提供侧边栏/面板的宽度拖拽调整功能，支持：
 * - 鼠标拖拽调整宽度
 * - 边界约束（最小/最大宽度）
 * - localStorage 持久化存储
 * - 组件卸载时自动清理事件监听
 *
 * @module composables/useResizable
 * @author
 * @since
 *
 * @example
 * ```js
 * const { width, isResizing, startResize } = useResizable(420, 300, 600)
 * ```
 */

import { ref, onUnmounted } from 'vue'

/** localStorage 存储侧边栏宽度的键名 */
const STORAGE_KEY = 'sidebar-width'

/**
 * 创建可拖拽调整宽度的响应式状态
 *
 * @param {number} [initialWidth=420] - 初始宽度（px）
 * @param {number} [minWidth=300] - 最小宽度限制（px）
 * @param {number} [maxWidth=600] - 最大宽度限制（px）
 * @returns {Object} 响应式状态和方法
 * @returns {import('vue').Ref<number>} returns.width - 当前宽度
 * @returns {import('vue').Ref<boolean>} returns.isResizing - 是否正在拖拽
 * @returns {Function} returns.startResize - 开始拖拽的回调（需绑定到 mousedown 事件）
 *
 * @description
 * 使用流程：
 * 1. 组件挂载时调用 hook，获取 width、isResizing 和 startResize
 * 2. 将 startResize 绑定到可拖拽手柄的 @mousedown 事件
 * 3. 使用返回的 width 值设置目标元素的宽度样式
 *
 * @example
 * ```vue
 * <script setup>
 * import { useResizable } from '@/composables/useResizable'
 * const { width, isResizing, startResize } = useResizable()
 * </script>
 *
 * <template>
 *   <div class="sidebar" :style="{ width: width + 'px' }">
 *     <!-- 内容 -->
 *   </div>
 *   <div class="handle" @mousedown="startResize"></div>
 * </template>
 * ```
 */
export function useResizable(initialWidth = 420, minWidth = 300, maxWidth = 600) {
    // Initialize from storage if available
    const storedWidth = localStorage.getItem(STORAGE_KEY)
    const startWidth = storedWidth ? parseInt(storedWidth) : initialWidth

    /** 当前宽度（响应式） */
    const width = ref(startWidth)

    /** 是否正在拖拽调整（响应式） */
    const isResizing = ref(false)

    /**
     * 处理拖拽移动事件
     *
     * @param {MouseEvent} e - 鼠标移动事件
     *
     * @description
     * 当 isResizing 为 true 时：
     * - 根据鼠标 X 坐标计算新宽度
     * - 限制在 minWidth ~ maxWidth 范围内
     * - 更新 width 值
     *
     * 该事件监听器在 startResize 时注册，在 stopResize 时移除
     */
    const handleResize = (e) => {
        if (!isResizing.value) return
        let newWidth = e.clientX
        if (newWidth < minWidth) newWidth = minWidth
        if (newWidth > maxWidth) newWidth = maxWidth
        width.value = newWidth
    }

    /**
     * 停止拖拽调整
     *
     * @description
     * 执行以下清理操作：
     * - 设置 isResizing 为 false
     * - 移除 mousemove 和 mouseup 事件监听
     * - 恢复 document.body 的默认光标和文本选择
     * - 将当前宽度保存到 localStorage
     *
     * 在以下时机调用：
     * - 用户释放鼠标（mouseup 事件）
     * - 组件卸载（onUnmounted）
     */
    const stopResize = () => {
        isResizing.value = false
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', stopResize)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        // Save to storage
        localStorage.setItem(STORAGE_KEY, width.value)
    }

    /**
     * 开始拖拽调整
     *
     * @param {MouseEvent} e - 鼠标按下事件（mousedown）
     *
     * @description
     * 初始化拖拽状态：
     * - 设置 isResizing 为 true
     * - 注册文档级别的 mousemove 和 mouseup 事件监听
     * - 修改 body 光标为 col-resize（列调整）
     * - 禁用文本选择（防止拖拽时选中文本）
     *
     * 通常绑定到可拖拽手柄元素的 @mousedown 事件
     */
    const startResize = (e) => {
        isResizing.value = true
        document.addEventListener('mousemove', handleResize)
        document.addEventListener('mouseup', stopResize)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }

    /**
     * 组件卸载时的清理逻辑
     *
     * @description
     * 确保组件卸载时：
     * - 如果正在拖拽则停止拖拽（清理事件监听）
     * - 防止内存泄漏
     * - 保存最终宽度到 localStorage
     */
    onUnmounted(() => {
        stopResize()
    })

    return {
        width,
        isResizing,
        startResize
    }
}
