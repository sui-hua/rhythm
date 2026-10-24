<script setup lang="ts">
/**
 * Badge.vue - 徽章组件
 *
 * 用于显示小标签、状态指示器或计数组件。
 * 支持多种变体样式（variant），通过 Tailwind CSS 类实现视觉效果。
 *
 * @description
 * - 接收 variant 属性控制样式变体（默认、销毁、Outline 等）
 * - 接收 class 属性以支持自定义样式覆盖
 * - 内部使用 badgeVariants 配置合并类名，支持 Tailwind 主题定制
 * - 插槽机制允许在徽章内插入任意内容
 *
 * @example
 * Badge - 默认徽章
 * Badge variant="destructive" - 销毁徽章
 * Badge variant="outline" - Outline 徽章
 *
 * @see {@link https://ui.shadcn.com/docs/components/badge} 官方文档
 * @see badgeVariants 配置项：src/components/ui/badge/index.ts
 */
import type { HTMLAttributes } from 'vue'
import { type BadgeVariants, badgeVariants } from '.'
import { cn } from '@/lib/utils'

// Props 定义
// variant: 徽章的视觉变体类型，控制颜色和样式（默认、销毁、Outline、Secondary、destructive 等）
// class: 额外的 CSS 类名，用于自定义样式或覆盖默认样式
const props = defineProps<{
  variant?: BadgeVariants['variant']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
