/**
 * ============================================
 * 移动端侧边栏层级控制 (views/day/composables/mobileLayers.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理移动端侧边栏的 CSS 类和样式
 * - 控制遮罩层动画
 * - 控制侧边栏显示/隐藏动画
 *
 * 【层级设计】
 * - 遮罩层：z-[40]
 * - 侧边栏容器：z-[50]
 *
 * 【动画策略】
 * - 侧边栏使用 translateX 实现滑入滑出
 * - PC 端使用 opacity 控制淡入淡出
 *
 * @module mobileLayers
 * @description 移动端侧边栏视图层叠与动画控制模块
 */

/**
 * 移动端侧边栏默认宽度（像素）
 * 用于计算遮罩层 left 偏移量，确保遮罩覆盖除侧边栏外的全屏区域
 * @type {number}
 */
export const MOBILE_SIDEBAR_WIDTH = 280

/**
 * 生成移动端遮罩层的 CSS 类名
 * 遮罩层为半透明黑色背景，带模糊效果，用于在侧边栏展开时遮挡主内容区
 *
 * @returns {string} Tailwind CSS 类名字符串
 * @example
 * // 返回: 'fixed top-0 right-0 bottom-0 z-[40] bg-black/40 backdrop-blur-[2px]'
 * getMobileOverlayClass()
 */
export const getMobileOverlayClass = () => 'fixed top-0 right-0 bottom-0 z-[40] bg-black/40 backdrop-blur-[2px]'

/**
 * 生成移动端遮罩层的内联样式
 * 通过 left 偏移量让遮罩层从侧边栏右侧开始覆盖，留出侧边栏区域
 *
 * @returns {Object} 内联样式对象，包含 left 偏移量
 * @example
 * // 返回: { left: '280px' }
 * getMobileOverlayStyle()
 */
export const getMobileOverlayStyle = () => ({
  left: `${MOBILE_SIDEBAR_WIDTH}px`
})

/**
 * 生成侧边栏面板的 CSS 类名
 * 面板包含边框、flex 布局和溢出控制，移动端和 PC 端共用基础样式
 *
 * @param {Object} params - 函数参数
 * @param {boolean} params.isMobile - 是否为移动端视口
 * @param {boolean} params.show - 侧边栏是否显示（当前未使用，预留）
 * @returns {string[]} Tailwind CSS 类名数组
 * @example
 * // 移动端: ['border-r', 'border-zinc-100', 'flex', 'flex-col', 'h-full', 'overflow-hidden', 'group', 'relative', 'bg-background']
 * // PC 端: ['border-r', 'border-zinc-100', 'flex', 'flex-col', 'h-full', 'overflow-hidden', 'group', 'relative', 'z-20', 'bg-background']
 * getSidebarPanelClass({ isMobile: true, show: false })
 */
export const getSidebarPanelClass = ({ isMobile, show }) => {
  const baseClasses = [
    'border-r',
    'border-zinc-100',
    'flex',
    'flex-col',
    'h-full',
    'overflow-hidden',
    'group'
  ]

  if (isMobile) {
    return [
      ...baseClasses,
      'relative',
      'bg-background'
    ]
  }

  return [
    ...baseClasses,
    'relative',
    'z-20',
    'bg-background'
  ]
}

/**
 * 生成侧边栏运动动画的 CSS 类名
 * 根据设备类型和显示状态返回不同的动画策略：
 * - 移动端：使用 translateX 滑动变换（show=true 时滑入，show=false 时滑出）
 * - PC 端：使用 opacity 淡入淡出（由 isReady 控制）
 *
 * @param {Object} params - 函数参数
 * @param {boolean} params.isMobile - 是否为移动端视口
 * @param {boolean} params.show - 侧边栏是否显示
 * @param {boolean} params.isReady - 数据是否已加载完成（仅 PC 端使用）
 * @returns {string[]} Tailwind CSS 类名数组
 * @example
 * // 移动端显示: ['transform-gpu', 'will-change-transform', 'ease-out', 'translate-x-0']
 * // 移动端隐藏: ['transform-gpu', 'will-change-transform', 'ease-out', '-translate-x-full']
 * // PC 端已就绪: ['opacity-100']
 * // PC 端加载中: ['opacity-0']
 * getSidebarMotionClass({ isMobile: true, show: true, isReady: true })
 */
export const getSidebarMotionClass = ({ isMobile, show, isReady }) => {
  if (isMobile) {
    return [
      'transform-gpu',
      'will-change-transform',
      'ease-out',
      show ? 'translate-x-0' : '-translate-x-full'
    ]
  }

  return [
    isReady ? 'opacity-100' : 'opacity-0'
  ]
}

/**
 * 生成移动端侧边栏容器壳的 CSS 类名
 * 固定定位在屏幕左侧，包含阴影、过渡动画和 GPU 加速
 * 通过 translateX 控制滑入（translate-x-0）滑出（-translate-x-full）
 *
 * @param {Object} params - 函数参数
 * @param {boolean} params.show - 侧边栏是否显示
 * @returns {string[]} Tailwind CSS 类名数组
 * @example
 * // 显示: ['fixed', 'left-0', 'top-0', 'bottom-0', 'z-50', 'overflow-hidden', 'bg-transparent', 'shadow-2xl', 'transition-transform', 'duration-300', 'transform-gpu', 'will-change-transform', 'ease-out', 'translate-x-0']
 * // 隐藏: [..., '-translate-x-full']
 * getMobileSidebarShellClass({ show: true })
 */
export const getMobileSidebarShellClass = ({ show }) => [
  'fixed',
  'left-0',
  'top-0',
  'bottom-0',
  'z-50',
  'overflow-hidden',
  'bg-transparent',
  'shadow-2xl',
  'transition-transform',
  'duration-300',
  'transform-gpu',
  'will-change-transform',
  'ease-out',
  show ? 'translate-x-0' : '-translate-x-full'
]
