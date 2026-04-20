/**
 * Separator 分割线组件
 * 
 * 基于 Radix Vue 的 Separator 原始组件进行封装，
 * 用于在视觉上分隔内容区域，支持水平/垂直方向。
 * 
 * @description
 * - 使用 Radix Vue 的无障碍分隔线组件，保证 WCAG 规范支持
 * - 支持 horizontal（水平）和 vertical（垂直）两种方向
 * - 默认样式：水平时高度 1px 撑满宽度，垂直时宽度 1px 撑满高度
 * - 通过 Tailwind 的 bg-border 使用主题色，支持 light/dark 双主题
 * - 支持传入 class 用于自定义样式扩展
 * 
 * @example
 * // 基础水平分割线
 * <Separator />
 * 
 * // 垂直分割线
 * <Separator orientation="vertical" />
 * 
 * // 自定义样式
 * <Separator class="my-4 mx-2" />
 */
<script setup lang="ts">
// Vue 核心库：HTML 属性类型定义和计算属性
import { type HTMLAttributes, computed } from 'vue'

// Radix Vue：提供无障碍分隔线组件实现
import { Separator, type SeparatorProps } from 'radix-vue'

// 工具函数：合并 Tailwind 类名，处理冲突
import { cn } from '@/lib/utils'

// 组件属性定义，支持 Radix Separator 所有原生属性 + 自定义 class
const props = defineProps<
  SeparatorProps & { class?: HTMLAttributes['class'] }
>()

/**
 * 分离原生属性与自定义 class
 * 
 * 将 props 中的 class 属性单独提取出来，
 * 其他属性透传给 Radix Separator 组件，
 * 避免 class 属性被重复应用两次
 * 
 * @computed delegatedProps - 排除 class 后的属性对象，用于透传
 */
const delegatedProps = computed(() => {
  // 使用解构赋值提取 class，剩余属性存入 delegated
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <!--
    Radix Separator 组件
    - v-bind 透传除 class 外的所有属性（orientation、decorative 等）
    - class 应用样式规则：
      1. shrink-0: 防止分割线被压缩
      2. bg-border: 使用主题定义的边框色（自动适配 light/dark）
      3. 方向样式：
         - vertical: 垂直时高度 100%，宽度 1px
         - horizontal（默认）: 水平时宽度 100%，高度 1px
      4. 用户传入的 class 用于自定义扩展
  -->
  <Separator
    v-bind="delegatedProps"
    :class="
      cn(
        'shrink-0 bg-border',
        props.orientation === 'vertical' ? 'h-full w-[1px]' : 'h-[1px] w-full',
        props.class,
      )
    "
  />
</template>
