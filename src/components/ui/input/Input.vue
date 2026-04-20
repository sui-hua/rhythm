/**
 * Input 组件
 * 
 * 提供统一的表单输入框组件，基于原生 <input> 元素封装。
 * 
 * 功能特性：
 * - 支持 v-model 双向绑定，与 Vue 3 Composition API 无缝集成
 * - 通过 useVModel 自动处理 modelValue 的读取和更新事件
 * - 支持 defaultValue 设置默认值
 * - 支持自定义 class 注入，可覆盖默认样式
 * - 内置 Tailwind CSS 样式，提供现代化的输入框外观
 * - 支持禁用状态、placeholder、focus 状态等原生 input 属性
 * 
 * 使用方式：
 * ```vue
 * <Input v-model="value" placeholder="请输入..." />
 * <Input v-model="value" default-value="默认值" />
 * <Input v-model="value" class="custom-input" />
 * ```
 * 
 * 样式说明：
 * - 高度 9 单位（h-9），符合 Tailwind 间距规范
 * - 圆角边框（rounded-md），略带阴影（shadow-sm）
 * - 支持 focus-visible 时的 ring 效果（focus-visible:ring-1）
 * - placeholder 使用 muted-foreground 颜色
 * - 禁用时 cursor-not-allowed + opacity-50
 */

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    :class="cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)"
  >
</template>
