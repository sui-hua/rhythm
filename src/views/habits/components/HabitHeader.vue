<script setup>
/**
 * 习惯页面头部组件 (HabitHeader.vue)
 *
 * 功能说明：
 * - 显示当前选中习惯的标题，作为习惯详情页面的页面头部
 * - 采用简洁的布局设计，仅包含习惯标题
 *
 * Props 说明：
 * - title: String (必填) - 当前习惯的标题名称，用于页面顶部展示
 *
 * 样式说明：
 * - 使用 flex 布局垂直排列，内部包含 h3 标题元素
 * - 底部 margin 为 2 单位，与下方内容保持间距
 * - 标题使用 3xl 字号，粗体，紧排，前景色样式
 *
 * 使用场景：
 * - 通常用于 Habits 模块的习惯详情页面顶部
 * - 作为习惯列表到习惯详情页的导航头部
 */
defineProps({
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
