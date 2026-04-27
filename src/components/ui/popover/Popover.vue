<script setup lang="ts">
/**
 * Popover 组件
 *
 * 基于 Radix Vue 的 PopoverRoot 封装，提供弹出式面板功能。
 * 该组件是一个轻量级包装器，将 props 和 emits 转发给底层的 Radix Popover 组件。
 *
 * @see https://www.radix-vue.com/components/popover.html
 */
import type { PopoverRootEmits, PopoverRootProps } from "radix-vue"
import { PopoverRoot, useForwardPropsEmits } from "radix-vue"

const props = defineProps<PopoverRootProps>()
const emits = defineEmits<PopoverRootEmits>()

// 将父组件传入的 props 和 emits 转发给 PopoverRoot
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <PopoverRoot v-bind="forwarded">
    <slot />
  </PopoverRoot>
</template>
