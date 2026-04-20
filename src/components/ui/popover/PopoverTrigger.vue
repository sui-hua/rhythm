/**
 * PopoverTrigger.vue
 * ===================
 * Popover 弹出层的触发器组件。
 *
 * 功能说明：
 * - 作为 Popover 的触发点，用户点击后打开 Popover 内容面板
 * - 底层封装了 Radix Vue 的 PopoverTrigger 组件，保持 API 一致性
 * - 支持插槽，允许自定义触发器内容（如按钮、图标等）
 *
 * 使用方式：
 * ```vue
 * <Popover>
 *   <PopoverTrigger>打开</PopoverTrigger>
 *   <PopoverContent>内容</PopoverContent>
 * </Popover>
 * ```
 *
 * 组件属性：
 * - 所有 props 透传给 Radix Vue 的 PopoverTrigger
 * - 常见属性：asChild（是否将触发器作为子元素渲染）等
 *
 * @see https://radix-vue.com/components/popover.html
 */

<script setup lang="ts">
import type { PopoverTriggerProps } from "radix-vue"
import { PopoverTrigger } from "radix-vue"

const props = defineProps<PopoverTriggerProps>()
</script>

<template>
  <PopoverTrigger v-bind="props">
    <slot />
  </PopoverTrigger>
</template>
