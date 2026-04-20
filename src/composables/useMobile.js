import { ref, onMounted, onUnmounted } from 'vue'

/**
 * @file useMobile.js
 * @description 移动端检测 Composables
 * 
 * 提供响应式的移动端设备检测功能，通过监听浏览器窗口宽度变化
 * 自动判断当前设备是否为移动端设备。
 * 
 * @author Rhythm Team
 * @see {@link https://vuejs.org/guide/reusability/composables.html Vue Composables}
 */

/**
 * 检测当前设备是否为移动端
 * 
 * @description 
 * 使用 Window.matchMedia API 监听屏幕宽度变化，当窗口宽度小于
 * 指定断点值时认为当前设备为移动端。该 composable 会在组件挂载时
 * 自动初始化监听，并在组件卸载时自动清理。
 * 
 * @param {number} [breakpoint=768] - 移动端断点阈值，单位为像素（px）
 *                                       默认为 768px，对应平板和桌面设备的分界线
 * @returns {Object} 返回一个响应式对象
 * @returns {import('vue').Ref<boolean>} returns.isMobile - 响应式布尔值，表示当前是否为移动端设备
 * 
 * @example
 * // 基础用法
 * const { isMobile } = useMobile()
 * 
 * @example
 * // 自定义断点
 * const { isMobile } = useMobile(1024)
 * 
 * @example
 * // 在模板中使用
 * <template>
 *   <div v-if="isMobile">
 *     <MobileLayout />
 *   </div>
 *   <div v-else>
 *     <DesktopLayout />
 *   </div>
 * </template>
 * 
 * @requires vue:ref - 用于创建响应式状态
 * @requires vue:onMounted - 用于在组件挂载时执行初始化逻辑
 * @requires vue:onUnmounted - 用于在组件卸载时执行清理逻辑
 */
export function useMobile(breakpoint = 768) {
    const isMobile = ref(false)
    let mql = null

    /**
     * 媒体查询状态变更处理函数
     * 
     * @description 
     * 当媒体查询结果发生变化时（窗口宽度跨越断点），此函数被调用
     * 并更新 isMobile 响应式状态，从而触发使用该状态的组件自动更新。
     * 
     * @param {MediaQueryEvent} e - 媒体查询事件对象
     * @param {boolean} e.matches - 媒体查询匹配结果，为 true 表示当前窗口宽度小于等于断点
     * @returns {void}
     * @private
     */
    const updateTarget = (e) => {
        isMobile.value = e.matches
    }

    /**
     * 组件挂载时的生命周期钩子
     * 
     * @description
     * 在组件首次渲染到 DOM 后调用，用于初始化媒体查询监听。
     * 创建一个 MediaQueryList 对象并注册 change 事件监听器，
     * 同时立即获取当前设备状态。
     * 
     * @returns {void}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia Window.matchMedia API}
     */
    onMounted(() => {
        mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
        mql.addEventListener('change', updateTarget)
        isMobile.value = mql.matches
    })

    /**
     * 组件卸载前的生命周期钩子
     * 
     * @description
     * 在组件即将从 DOM 中移除时调用，用于清理媒体查询监听器。
     * 移除之前注册的 change 事件监听器，防止内存泄漏。
     * 
     * @returns {void}
     */
    onUnmounted(() => {
        if (mql) {
            mql.removeEventListener('change', updateTarget)
        }
    })

    return {
        isMobile
    }
}
