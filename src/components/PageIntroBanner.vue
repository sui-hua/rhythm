<template>
  <section class="rounded-3xl border border-border bg-card px-5 py-4">
    <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{{ title }}</h1>
    <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ subtitle }}</p>
  </section>
</template>

<script setup>
/**
 * PageIntroBanner - 页面介绍横幅组件
 *
 * 用于在各主要页面顶部展示统一的介绍性横幅，包含三个信息层级：
 * - eyebrow: 页面所属分类/模块的标签（如"当前页面"），用于快速定位页面所属模块
 * - title: 页面的主标题，字号较大，用于直观表达页面核心功能
 * - subtitle: 页面的副标题/描述文字，用于补充说明页面的具体作用或当前状态
 *
 * 设计规范：
 * - 使用圆角卡片容器（rounded-3xl），与整体 UI 风格保持一致
 * - 采用分层信息架构，通过字号、字重、颜色的差异区分信息层级
 * - 遵循 8px 基准网格系统，padding 为 5（40px），各层级间距为 2（16px）
 *
 * 使用场景：
 * - DirectionDesktopPage: 展示目标管理的页面标题和描述
 * - DayPage: 展示每日时间轴的页面标题和描述
 * - HabitsDesktopPage: 展示习惯追踪的页面标题和描述
 * - SummaryPage: 展示数据总结的页面标题和描述
 *
 * @prop {string} eyebrow - 页面分类标签，默认值 "当前页面"
 * @prop {string} title - 页面主标题，必填
 * @prop {string} subtitle - 页面副标题/描述，必填
 */
defineProps({
  eyebrow: { type: String, default: '当前页面' },
  title: { type: String, required: true },
  subtitle: { type: String, required: true }
})
</script>
