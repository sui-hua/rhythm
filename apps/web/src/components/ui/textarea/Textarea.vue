/**
 * Textarea 组件
 * 
 * 一个受控的文本输入框组件，基于 Vue 3 Composition API 和 TypeScript 实现。
 * 
 * 功能特性：
 * - 支持 v-model 双向绑定，与 VueUse 的 useVModel 集成实现响应式数据流
 * - 支持 defaultValue 初始化默认值
 * - 支持通过 class prop 自定义样式，底层使用 Tailwind CSS 和 cn 工具函数合并类名
 * - 自动应用无障碍样式：placeholder 颜色、focus 环、禁用态光标和透明度
 * - 原生 textarea 元素，保留浏览器默认行为（如拖拽调整大小）
 * 
 * 使用方式：
 * ```vue
 * <Textarea v-model="content" placeholder="请输入..." />
 * <Textarea :model-value="content" @update:model-value="content = $event" />
 * ```
 * 
 * @prop class - 额外的 Tailwind CSS 类名，用于自定义样式
 * @prop defaultValue - 非受控模式的初始值
 * @prop modelValue - 受控模式的当前值（v-model 绑定）
 * @emits update:modelValue - 当用户输入时触发，传递新的文本值
 */

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
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
  <textarea
    v-model="modelValue"
    :class="
      cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
