/**
 * CardDescription.vue
 *
 * 卡片描述文本组件，用于在 Card 组件内显示辅助说明或次要信息。
 *
 * @component
 * @description
 * 提供统一的卡片描述样式（text-sm text-muted-foreground），支持通过 class prop
 * 注入额外的 Tailwind 类名以实现自定义样式扩展。内部通过 Vue 的 slot 机制
 * 支持任意内容分发，包括纯文本、HTML 或其他 Vue 组件。
 *
 * @prop {HTMLAttributes['class']} [class] - 可选的额外 CSS 类名，用于自定义样式
 *
 * @example
 * <!-- 基本用法 -->
 * <CardDescription>这是一段描述文本</CardDescription>
 *
 * <!-- 携带自定义样式 -->
 * <CardDescription class="font-bold">加粗的描述</CardDescription>
 *
 * <!-- 嵌套其他内容 -->
 * <CardDescription>
 *   <span>支持</span> <strong>HTML</strong> 内容
 * </CardDescription>
 *
 * @requires cn - 来自 @/lib/utils 的类名合并工具函数
 * @requires Card - 通常作为 Card 组件的子组件使用
 */

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <p :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </p>
</template>
