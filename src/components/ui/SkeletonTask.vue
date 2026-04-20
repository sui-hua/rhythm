<template>
  <div class="flex flex-col gap-3 p-4 mx-1 rounded-2xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-100/50 dark:border-white/5 animate-pulse">
    <div class="flex items-center gap-3">
      <div class="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4" />
        <div class="h-3 bg-zinc-100 dark:bg-zinc-900 rounded-md w-1/2" />
      </div>
    </div>
    <div class="ml-8 flex gap-2">
      <div class="h-2 w-12 bg-zinc-100 dark:bg-zinc-900 rounded-full" />
      <div class="h-2 w-8 bg-zinc-100 dark:bg-zinc-900 rounded-full" />
    </div>
  </div>
</template>

<script setup>
/**
 * SkeletonTask - 任务项骨架屏组件
 *
 * @description
 * 用于在任务数据加载过程中显示占位骨架，提升用户感知体验。
 * 采用脉冲动画（animate-pulse）模拟内容加载状态，避免页面跳动。
 *
 * @feature
 * - 响应式设计：支持亮色/暗色主题自动切换（通过 dark: 类前缀）
 * - 层级结构：模拟任务卡片布局，包含复选框区、标题描述区、标签区
 * - 极简实现：纯 CSS/Tailwind，无 JavaScript 依赖
 *
 * @usage
 * <SkeletonTask />
 *
 * @see {@link https://tailwindcss.com/docs/animation} Tailwind 动画文档
 */
</script>

<style scoped>
/* 继承全局脉冲动画 */
</style>
