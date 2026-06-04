<template>
  <!--
    PageIntroBanner — 页面顶部介绍横幅
    主要结构：眉题（eyebrow）、标题（title）、副标题（subtitle）
  -->
  <section class="rounded-3xl border border-border bg-card px-5 py-4">
    <!-- 眉题：分类或页面标识 -->
    <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
    <!-- 主标题 -->
    <h1 class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h1>
    <!-- 副标题：页面功能说明 -->
    <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ subtitle }}</p>
  </section>
</template>

<script lang="ts" setup>
/**
 * PageIntroBanner — 页面顶部介绍横幅组件
 *
 * 展示页面的眉题、主标题和副标题，用于各页面顶部的统一介绍区域。
 */

// ── Props ──
// 眉题文字，默认"当前页面"
// 主标题，必填
// 副标题，必填，说明页面功能或用途
defineProps({
  eyebrow: { type: String, default: '当前页面' },
  title: { type: String, required: true },
  subtitle: { type: String, required: true }
})
</script>
