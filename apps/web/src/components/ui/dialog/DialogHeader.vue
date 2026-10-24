<script setup lang="ts">
/**
 * DialogHeader 组件
 *
 * 用于对话框（Dialog）的头部区域，提供标准化的标题区域布局。
 *
 * @description
 * - 采用左对齐的 flex 布局，在小屏幕（sm）以下则居中显示
 * - 支持通过 class prop 自定义样式，直接透传给外层 div
 * - 内部通过默认插槽（slot）接收标题、描述等头部内容
 * - 通常配合 DialogTitle、DialogDescription 等子组件使用
 *
 * @see https://radix-vue.com/components/dialog
 */
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn('flex flex-col gap-y-1.5 text-center sm:text-left', props.class)"
  >
    <slot />
  </div>
</template>
