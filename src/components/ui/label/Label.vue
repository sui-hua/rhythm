/**
 * Label.vue - 表单标签组件
 * 
 * 基于 Radix Vue 的 Label 原语构建的表单标签组件，提供无障碍访问支持。
 * 该组件继承 Radix Label 的所有功能，并使用 Tailwind CSS 进行样式定制。
 * 
 * 主要特性：
 * - 语义化的 `<label>` 元素，关联表单控件实现无障碍访问
 * - 支持 Radix Label 的所有原生属性（for、required、disabled 等）
 * - 通过 Tailwind 样式实现默认样式，支持通过 class prop 自定义
 * - 自动处理 class 透传，避免与内部样式冲突
 * 
 * @example
 * // 基本用法
 * <Label>用户名</Label>
 * 
 * // 关联表单控件
 * <Label for="email">邮箱地址</Label>
 * <Input id="email" type="email" />
 * 
 * // 禁用状态的标签（配合 peer-disabled 使用）
 * <Label disabled>不可编辑</Label>
 */
<script setup lang="ts">
// Vue 核心库：computed 用于创建计算属性，type HTMLAttributes 用于类型定义
import { type HTMLAttributes, computed } from 'vue'

// Radix Vue 的 Label 组件：提供无障碍的标签功能，支持键盘导航和屏幕阅读器
import { Label, type LabelProps } from 'radix-vue'

// 工具函数：合并 Tailwind 类名，处理条件类名和冲突类名
import { cn } from '@/lib/utils'

/**
 * 组件属性定义
 * 继承 Radix Label 的所有属性，并扩展 class 属性用于自定义样式
 * 
 * @prop {LabelProps} LabelProps - Radix Label 的原生属性
 * @prop {string} [class] - 自定义 Tailwind 类名
 */
const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

/**
 * 计算属性：分离 class 属性与其他属性
 * 
 * 将 props 中的 class 属性单独提取，避免其被传递到底层 DOM 元素。
 * Radix Vue 的 class 样式通过内部机制处理，不需要透传到原生 label 元素。
 * 
 * @returns {Object} 去除 class 后的属性对象，用于 v-bind 批量绑定到 Label 组件
 */
const delegatedProps = computed(() => {
  // 使用解构赋值分离 class 与其他属性
  // class: _ 表示将 class 重命名为 _（表示丢弃），其余属性收集到 delegated 对象
  const { class: _, ...delegated } = props

  // 返回去除 class 的属性对象，供 Label 组件使用
  return delegated
})
</script>

<template>
  <Label
    v-bind="delegatedProps"
    :class="
      cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.class,
      )
    "
  >
    <slot />
  </Label>
</template>
