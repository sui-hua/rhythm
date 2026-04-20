/**
 * SelectItemText.vue
 * 
 * 文件说明：
 * -------------
 * SelectItemText 是 Reka UI 下拉选择组件库中的文本展示组件，
 * 专门用于在 SelectItem（选择项）中显示可读的文本内容。
 * 
 * 功能作用：
 * -------------
 * 1. 作为 SelectItem 的子组件，负责渲染选项的显示文本
 * 2. 将传入的 props 透传给 Reka UI 的 SelectItemText 组件
 * 3. 支持默认插槽，允许自定义文本内容
 * 4. 通常配合 Select、SelectTrigger、SelectContent、SelectItem 等组件使用
 * 
 * 使用方式：
 * -------------
 * ```vue
 * <SelectItem value="option1">
 *   <SelectItemText>选项一</SelectItemText>
 * </SelectItem>
 * ```
 * 
 * 或使用插槽：
 * ```vue
 * <SelectItem value="option1">
 *   <SelectItemText>自定义文本</SelectItemText>
 * </SelectItem>
 * ```
 * 
 * 组件关系：
 * -------------
 * - 父组件：通常为 SelectItem
 * - 子组件：默认插槽内容
 * - 配合组件：SelectTrigger（触发器）、SelectContent（内容区）、
 *             SelectItem（选项项）、SelectValue（值显示）
 * 
 * 注意事项：
 * -------------
 * 1. 本组件是透明封装，直接透传所有 props 给 Reka UI 底层组件
 * 2. 文本内容通过默认插槽传入
 * 3. 组件本身不处理任何业务逻辑，仅做渲染和透传
 */

<script setup lang="ts">
import type { SelectItemTextProps } from "reka-ui"
import { SelectItemText } from "reka-ui"

const props = defineProps<SelectItemTextProps>()
</script>

<template>
  <SelectItemText v-bind="props">
    <slot />
  </SelectItemText>
</template>
