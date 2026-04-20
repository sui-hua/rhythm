/**
 * SelectTrigger.vue
 * @description 下拉选择器触发按钮组件
 * 
 * 功能说明：
 * - 作为 Select 组件的触发器，显示当前选中的值或占位文本
 * - 集成了 ChevronDown 图标作为展开指示器
 * - 支持自定义样式类和数据占位符显示
 * 
 * 使用方式：
 * ```vue
 * <SelectTrigger>选择一个选项</SelectTrigger>
 * ```
 * 
 * 样式特点：
 * - 高度 40px，圆角边框，符合表单控件规范
 * - 支持 focus:ring 焦点状态
 * - 支持 disabled 禁用状态（降低透明度，禁用光标）
 * - 占位文本使用 muted-foreground 颜色
 * 
 * 依赖组件：
 * - SelectTrigger (reka-ui) - 基础触发器
 * - SelectIcon (reka-ui) - 图标容器
 * - ChevronDown (lucide-vue-next) - 展开箭头图标
 */

<script setup lang="ts">
import type { SelectTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronDown } from "lucide-vue-next"
import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate text-start',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="w-4 h-4 opacity-50 shrink-0" />
    </SelectIcon>
  </SelectTrigger>
</template>
