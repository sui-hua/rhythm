<script setup lang="ts">
/**
 * CardTitle 组件
 *
 * 用于在 Card 卡片内部渲染标题文本，输出语义化的 h3 标题元素。
 *
 * @feature - 基于 Tailwind CSS 的 font-semibold、leading-none、tracking-tight 基础样式
 * @feature - 支持通过 class prop 注入额外样式类，实现个性化定制
 * @feature - 透传插槽内容，允许嵌套其他组件或纯文本
 *
 * @see https://vuejs.org/api/sfc-script-setup.html
 * @see https://tailwindcss.com/docs/font-weight#font-semibold
 */
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /**
   * 可选的额外 CSS 类名，用于自定义样式或覆盖默认样式。
   * 传入的类名会与组件内置的基础类名合并。
   */
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <h3
    :class="cn('font-semibold leading-none tracking-tight', props.class)"
  >
    <slot />
  </h3>
</template>
