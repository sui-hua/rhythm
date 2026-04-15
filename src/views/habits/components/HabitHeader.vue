<script setup>
/**
 * 习惯页面头部组件 (HabitHeader.vue)
 * 展示当前选中习惯的标题，作为该习惯详情视图的页级标题。
 */
defineProps({
  /**
   * 当前选中习惯的名称，用于页面标题展示
   */
  title: {
    type: String,
    required: true
  }
})
</script>

<template>
  <header class="flex flex-col gap-2 mb-2">
    <h3 class="text-3xl font-bold tracking-tight text-foreground">{{ title }}</h3>
  </header>
</template>
