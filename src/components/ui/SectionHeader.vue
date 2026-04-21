<template>
  <header class="space-y-2">
    <p class="text-[11px] font-bold uppercase text-muted-foreground" :style="{ letterSpacing: uiGrammar.section.eyebrowTracking }">{{ eyebrow }}</p>
    <h2 class="text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h2>
    <p v-if="description" class="text-sm leading-6 text-muted-foreground">{{ description }}</p>
  </header>
</template>
<script setup>
/**
 * SectionHeader - 页面/区块标题组件
 *
 * 用于渲染标准化的区块标题结构，包含眉题（eyebrow）、主标题（title）和可选描述（description）。
 * 常见于页面顶部或卡片内的区块标题展示。
 *
 * 使用示例：
 * // 基础用法
 * // 传入 eyebrow、title 和可选的 description 参数
 *
 * // 带描述
 * // 传入 eyebrow、title 和 description 参数
 *
 * @props
 * @param {string} eyebrow - 眉题文字，通常为大写小号字母间距文字，如分类标签
 * @param {string} title - 主标题，主层级标题文字
 * @param {string} [description] - 可选描述，副层级说明文字
 *
 * @designTokens
 * - eyebrow letterSpacing: 取自 uiGrammar.section.eyebrowTracking
 * - 暗色模式下 text-muted-foreground 颜色自动适配
 */

defineProps({
  eyebrow: String,
  title: String,
  description: String
})
</script>
