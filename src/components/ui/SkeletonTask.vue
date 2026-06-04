<template>
  <!--
    SkeletonTask — 任务项骨架屏
    主要结构：复选框占位、标题/描述占位、标签占位
  -->
  <div class="flex flex-col gap-3 p-4 mx-1 rounded-2xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-100/50 dark:border-white/5 animate-pulse">
    <!-- 顶部行：复选框 + 标题/描述 -->
    <div class="flex items-center gap-3">
      <div class="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4" />
        <div class="h-3 bg-zinc-100 dark:bg-zinc-900 rounded-md w-1/2" />
      </div>
    </div>
    <!-- 底部行：标签占位 -->
    <div class="ml-8 flex gap-2">
      <div class="h-2 w-12 bg-zinc-100 dark:bg-zinc-900 rounded-full" />
      <div class="h-2 w-8 bg-zinc-100 dark:bg-zinc-900 rounded-full" />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * SkeletonTask — 任务项骨架屏组件
 *
 * 任务数据加载过程中显示的占位骨架，采用脉冲动画模拟加载状态。
 * 纯 CSS/Tailwind 实现，无 JavaScript 依赖，支持亮色/暗色主题。
 */
</script>

<style scoped>
</style>
