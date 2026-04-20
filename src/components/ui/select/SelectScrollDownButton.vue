/**
 * SelectScrollDownButton.vue
 * 
 * 下拉选择器滚动向下按钮组件
 * 
 * 功能说明：
 * - 作为 Select 组件的滚动指示器，当选项列表过长时可以点击此按钮向下滚动
 * - 集成自 Reka UI 的 SelectScrollDownButton 基础组件
 * - 支持默认插槽自定义图标，默认显示 ChevronDown (向下箭头)
 * 
 * 使用方式：
 * <SelectScrollDownButton>自定义图标</SelectScrollDownButton>
 * 
 * 样式特性：
 * - 垂直居中对齐 (items-center justify-center)
 * - 内边距 py-1 提供适当的点击区域
 * - 继承父组件传递的 class 样式
 * 
 * @see https://reka-ui.com/docs/select
 */

<script setup lang="ts">
import type { SelectScrollDownButtonProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronDown } from "lucide-vue-next"
import { SelectScrollDownButton, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SelectScrollDownButtonProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectScrollDownButton v-bind="forwardedProps" :class="cn('flex cursor-default items-center justify-center py-1', props.class)">
    <slot>
      <ChevronDown class="h-4 w-4" />
    </slot>
  </SelectScrollDownButton>
</template>
