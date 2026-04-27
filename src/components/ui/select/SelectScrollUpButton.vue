<script setup lang="ts">
/**
 * SelectScrollUpButton 组件
 *
 * 这是 Select 组件的滚动向上按钮，用于在 Select 下拉列表滚动时显示在顶部，
 * 允许用户快速滚动回列表顶部。
 *
 * 功能说明：
 * - 基于 Reka UI 的 SelectScrollUpButton 封装
 * - 使用 lucide-vue-next 的 ChevronUp 图标作为默认向上滚动指示器
 * - 支持自定义 class 样式（通过 Tailwind CSS）
 * - 支持默认插槽，允许用户自定义按钮内容
 */
// Reka UI 提供的 SelectScrollUpButton 类型定义，用于接收原生按钮属性
import type { SelectScrollUpButtonProps } from "reka-ui"
// Vue HTML 属性的类型定义，用于 class 属性的类型支持
import type { HTMLAttributes } from "vue"
// VueUse 工具函数：从响应式对象中排除指定键，生成新的响应式对象
import { reactiveOmit } from "@vueuse/core"
// Lucide 图标库提供的向上箭头图标，作为默认滚动指示器
import { ChevronUp } from "lucide-vue-next"
// Reka UI 的 SelectScrollUpButton 组件和 useForwardProps 组合式函数
import { SelectScrollUpButton, useForwardProps } from "reka-ui"
// 工具函数：合并 Tailwind CSS 类名，支持条件类名
import { cn } from "@/lib/utils"

// 定义组件 props，合并 Reka UI 的 SelectScrollUpButtonProps 和自定义的 class 属性
const props = defineProps<SelectScrollUpButtonProps & { class?: HTMLAttributes["class"] }>()

// 从 props 中排除 'class' 键，将剩余的 props 传递给 SelectScrollUpButton
// reactiveOmit 会创建一个新的响应式对象，不影响原始 props
const delegatedProps = reactiveOmit(props, "class")

// 使用 useForwardProps 将处理后的 props 转发给 SelectScrollUpButton 组件
// 这样可以让组件正确接收所有必要的属性和事件
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectScrollUpButton v-bind="forwardedProps" :class="cn('flex cursor-default items-center justify-center py-1', props.class)">
    <slot>
      <ChevronUp class="h-4 w-4" />
    </slot>
  </SelectScrollUpButton>
</template>
