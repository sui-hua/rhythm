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
 */
export const MOBILE_SIDEBAR_WIDTH = 280

export const getMobileOverlayClass = () => 'fixed top-0 right-0 bottom-0 z-[40] bg-black/40 backdrop-blur-[2px]'

export const getMobileOverlayStyle = () => ({
  left: `${MOBILE_SIDEBAR_WIDTH}px`
})

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
