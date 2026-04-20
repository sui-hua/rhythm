<template>
  <!-- 过渡动画容器：全局加载指示器 -->
  <!-- 当 isGlobalLoading 为 true 时以淡入淡出动画显示加载条 -->
  <Transition name="global-loading-fade">
    <div
      v-if="isGlobalLoading"
      class="global-loading"
      aria-live="polite"
      aria-label="页面加载中"
      role="status"
    >
      <!-- 加载条轨道：固定在页面顶部，高度为 1px -->
      <div class="global-loading-track">
        <!-- 加载条本体：使用 indeterminate 动画展现加载状态 -->
        <div class="global-loading-bar" />
      </div>
    </div>
  </Transition>
</template>

<!--
  GlobalLoadingBar.vue - 全局加载条组件

  功能说明：
  - 固定在页面顶部，显示一个水平进度条
  - 使用 indeterminate（不确定进度）动画表示持续加载状态
  - 通过 useGlobalLoading composable 获取全局加载状态
  - 支持淡入淡出过渡动画

  使用方式：
  - 在应用根组件中全局注册，无需手动控制显示/隐藏
  - useGlobalLoading() 返回的 isGlobalLoading 为 true 时自动显示
  - 通常配合路由守卫或接口请求拦截器使用

  样式特点：
  - position: fixed，固定在视口顶部，不影响页面布局
  - pointer-events: none，点击事件穿透，不阻止用户操作
  - z-index: 9999，确保置于最顶层
  - 动画：从左侧滑入，反复循环，营造持续加载的视觉效果
-->
<script setup>
import { useGlobalLoading } from '@/composables/useGlobalLoading'
const { isGlobalLoading } = useGlobalLoading()
</script>

<style scoped>
/* 引用主题配置中的设计令牌 */
@reference "@/assets/tw-theme.css";

/* 全局加载条容器：固定在页面顶部最上层 */
.global-loading {
  @apply fixed top-0 left-0 right-0 z-[9999] pointer-events-none;
}

/* 加载条轨道：透明背景，高度 1px */
.global-loading-track {
  @apply h-1 w-full bg-transparent;
}

/* 加载条本体：主题色填充，起点变换原点 */
.global-loading-bar {
  @apply h-full bg-primary origin-left;
  animation: loading-bar-indeterminate 1s ease-in-out infinite;
}

/*
  indeterminate 动画：
  - 0%: 加载条从左侧外进入，scaleX(0.3) 小尺寸
  - 50%: 加载条居中偏右，scaleX(0.7) 中等尺寸
  - 100%: 加载条移动到右侧外，scaleX(0.3) 小尺寸
  整体循环 1s，营造持续加载的视觉效果
*/
@keyframes loading-bar-indeterminate {
  0% {
    transform: translateX(-100%) scaleX(0.3);
  }
  50% {
    transform: translateX(30%) scaleX(0.7);
  }
  100% {
    transform: translateX(100%) scaleX(0.3);
  }
}

/* 淡入淡出过渡：透明度 0.2s ease */
.global-loading-fade-enter-active,
.global-loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

/* 淡入淡出起止状态：透明度从 0 到 1 */
.global-loading-fade-enter-from,
.global-loading-fade-leave-to {
  opacity: 0;
}
</style>
