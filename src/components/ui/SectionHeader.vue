<template>
  <!--
    SectionHeader — 区块标题组件
    主要结构：眉题（eyebrow）、主标题（title）、可选描述（description）
  -->
  <header class="space-y-2">
    <!-- 眉题：分类标签，大写小号字母间距文字 -->
    <p class="text-[11px] font-bold uppercase text-muted-foreground" :style="{ letterSpacing: uiGrammar.section.eyebrowTracking }">{{ eyebrow }}</p>
    <!-- 主标题 -->
    <h2 class="text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h2>
    <!-- 可选描述 -->
    <p v-if="description" class="text-sm leading-6 text-muted-foreground">{{ description }}</p>
  </header>
</template>

<script lang="ts" setup>
/**
 * SectionHeader — 区块标题组件
 *
 * 渲染标准化的区块标题结构，包含眉题、主标题和可选描述。
 * 眉题的字母间距从 uiGrammar 配置中心读取。
 */

// ── 依赖导入 ──
import { uiGrammar } from '@/config/uiGrammar'

// ── Props ──
// eyebrow：眉题文字，通常为大写小号字母间距文字
// title：主标题
// description：可选描述文字
defineProps({
  eyebrow: String,
  title: String,
  description: String
})
</script>
