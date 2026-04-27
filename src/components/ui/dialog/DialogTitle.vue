<script setup lang="ts">
/**
 * DialogTitle.vue - 对话框标题组件
 *
 * 基于 Radix UI DialogTitle 原语构建的 Vue 3 组件，用于对话框的标题展示。
 *
 * 功能特性：
 * - 透传 Radix DialogTitle 的所有 props 属性
 * - 自动合并 class，提供默认样式（text-lg font-semibold leading-none tracking-tight）
 * - 支持通过 class prop 添加自定义样式
 * - 配合 Dialog 组件使用，作为对话框的头部标题
 *
 * @see https://www.radix-vue.com/components/dialog.html
 */
import { type HTMLAttributes, computed } from 'vue'
import { DialogTitle, type DialogTitleProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <DialogTitle
    v-bind="delegatedProps"
    :class="
      cn(
        'text-lg font-semibold leading-none tracking-tight',
        props.class,
      )
    "
  >
    <slot />
  </DialogTitle>
</template>
