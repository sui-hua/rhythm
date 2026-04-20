/**
 * Select.vue - 下拉选择器包装组件
 * 
 * 功能说明：
 * - 基于 Radix UI 的 SelectRoot 封装，提供统一下拉选择功能
 * - 支持单选模式，是项目中所有选择组件的底层支撑
 * 
 * 使用方式：
 * - 通常配合 SelectTrigger、SelectContent、SelectItem 等子组件使用
 * - 通过 v-bind 将 props 和 events 转发给内部组件
 * 
 * 技术实现：
 * - 使用 Reka UI 的 useForwardPropsEmits 工具实现 props/emits 转发
 * - 透传模式，不添加额外逻辑，保持组件树的纯净
 * 
 * @see https://reka-ui.com/docs/select
 */

<script setup lang="ts">
import type { SelectRootEmits, SelectRootProps } from "reka-ui"
import { SelectRoot, useForwardPropsEmits } from "reka-ui"

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SelectRoot v-bind="forwarded">
    <slot />
  </SelectRoot>
</template>
