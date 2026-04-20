/**
 * Progress 进度条组件
 *
 * @description
 * 基于 Radix UI Progress 原始组件封装的 Vue 3 进度条组件。
 * 支持双向绑定 (v-model)，默认从左向右填充显示进度。
 *
 * @example
 * <!-- 基本用法 -->
 * <Progress v-model="value" />
 *
 * <!-- 带自定义样式 -->
 * <Progress v-model="value" class="w-64" />
 *
 * @see https://www.radix-vue.com/components/progress.html Radix Vue Progress 文档
 */
<script setup lang="ts">
/**
 * 引入 Vue 组合式 API：
 * - HTMLAttributes: 用于约束 class 属性的类型
 * - computed: 计算属性，用于处理 props 代理
 */
import { type HTMLAttributes, computed } from 'vue'

/**
 * 引入 Radix Vue 进度条相关组件和类型：
 * - ProgressRoot: 进度条外层容器
 * - ProgressIndicator: 进度条填充指示器
 * - ProgressRootProps: 进度条根组件的属性类型
 */
import {
  ProgressIndicator,
  ProgressRoot,
  type ProgressRootProps,
} from 'radix-vue'

/** 引入工具函数：cn 用于合并 Tailwind CSS 类名 */
import { cn } from '@/lib/utils'

/**
 * 定义组件 props
 * 合并了 Radix ProgressRootProps 和自定义 class 属性
 * modelValue 默认值为 0，表示进度百分比（0-100）
 */
const props = withDefaults(
  defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>(),
  {
    modelValue: 0,
  },
)

/**
 * 代理属性计算属性
 * 将 class 属性从 props 中分离出来，避免传递给 Radix 组件时产生冲突
 * Radix 组件会正确处理其余的 props（如 modelValue、max 等）
 */
const delegatedProps = computed(() => {
  // 使用解构赋值提取 class，剩余属性通过 ...delegated 传递
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <!--
    ProgressRoot: 进度条外层容器
    - v-bind="delegatedProps": 绑定除 class 外的所有 props
    - class: 应用基础样式（固定高度、圆角、背景色）
  -->
  <ProgressRoot
    v-bind="delegatedProps"
    :class="
      cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
        props.class,
      )
    "
  >
    <!--
      ProgressIndicator: 进度填充指示器
      - class: 填充样式（高度100%、过渡动画）
      - style: 通过 translateX 实现从右向左的进度填充效果
        例如 modelValue=70 时，translateX(-30%) 表示填充70%的宽度
    -->
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%);`"
    />
  </ProgressRoot>
</template>
