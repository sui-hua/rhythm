/**
 * SelectValue - 选择器选中值展示组件
 * 
 * 这是 Reka UI Select 组件的包装器，用于显示当前选中的选项值。
 * 
 * 功能说明：
 * - 透传 Reka UI 的 SelectValue 组件所有属性和事件
 * - 支持默认插槽，允许自定义选中值的显示格式
 * - 与 SelectTrigger 配合使用，显示当前选中项的文本
 * 
 * 使用方式：
 * ```vue
 * <SelectTrigger>
 *   <SelectValue placeholder="请选择..." />
 * </SelectTrigger>
 * ```
 * 
 * @see https://Reka-ui.vercel.app/docs/primitives/select
 */
<script setup lang="ts">
import type { SelectValueProps } from "reka-ui"
import { SelectValue } from "reka-ui"

const props = defineProps<SelectValueProps>()
</script>

<template>
  <SelectValue v-bind="props">
    <slot />
  </SelectValue>
</template>
