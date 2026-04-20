/**
 * SelectSeparator - 下拉选择框分隔线组件
 *
 * 功能说明：
 * - 在 Select 组件的选项之间添加视觉分隔线
 * - 用于分组相关选项或区分不同类别的选项
 *
 * 技术实现：
 * - 基于 Reka UI 的 SelectSeparator 原生组件封装
 * - 使用 reactiveOmit 分离 class 属性与其他 props，避免属性冲突
 * - 样式通过 Tailwind CSS 工具函数 cn() 合并，默认样式为水平分割线
 *
 * 使用方式：
 * <SelectContent>
 *   <SelectItem>选项一</SelectItem>
 *   <SelectSeparator />
 *   <SelectItem>选项二</SelectItem>
 * </SelectContent>
 *
 * @example
 * <!-- 带自定义 class 的分隔线 -->
 * <SelectSeparator class="my-2" />
 */

<script setup lang="ts">
import type { SelectSeparatorProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SelectSeparator } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SelectSeparatorProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <SelectSeparator v-bind="delegatedProps" :class="cn('-mx-1 my-1 h-px bg-muted', props.class)" />
</template>
