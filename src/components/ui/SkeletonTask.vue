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

<!--
  SkeletonTask 组件 - 任务骨架屏
  用于加载状态显示，带脉冲动画效果
-->
<script setup>
// 极简骨架屏组件
</script>

<style scoped>
/* 继承全局脉冲动画 */
</style>
