<!--
  ============================================
  按钮组件 (components/ui/button/Button.vue)
  ============================================

  【模块职责】
  - 基于 Radix Vue Primitive 的无状态按钮封装
  - 支持多种变体和尺寸

  【使用方式】
  <Button variant="default" size="default">按钮</Button>

  【Variant 类型】
  - default / destructive / outline / secondary / ghost / link
-->

<!--
  ============================================
  Button 组件详细文档
  ============================================

  【组件描述】
  Button 是基于 Radix Vue Primitive 封装的无状态按钮组件，提供统一的按钮样式和交互体验。
  通过 Tailwind CSS 类和 Variant 模式实现多种视觉变体，支持灵活自定义样式。

  【Props】
  - variant?: ButtonVariants['variant']  - 按钮样式变体，默认 'default'
  - size?: ButtonVariants['size']        - 按钮尺寸，默认 'default'
  - class?: HTMLAttributes['class']      - 自定义 CSS 类名，用于覆盖或扩展默认样式
  - as?: string                           - 渲染的 HTML 标签或组件，默认为 'button'
  - asChild?: boolean                     - 是否将子元素作为实际渲染内容（Radix Primitive 特性）

  【Variant 可选值】
  - 'default'    : 默认样式，主色调填充按钮，适用于主要操作
  - 'destructive': 危险/删除操作样式，红色系，适用于不可逆操作
  - 'outline'    : 描边样式，透明背景带边框，适用于次要操作
  - 'secondary'  : 次要样式，灰色系，适用于不那么强调的操作
  - 'ghost'      : 幽灵样式，无背景色，hover 时显示背景，适用于安静操作
  - 'link'       : 链接样式，文字按钮，适用于跳转或轻量操作

  【Size 可选值】
  - 'default': 默认尺寸
  - 'sm'     : 小尺寸
  - 'lg'     : 大尺寸
  - 'icon'   : 图标专用尺寸，正方形，适用于纯图标按钮

  【Slots】
  - default: 按钮内容，可包含文本或其他元素

  【样式来源】
  - 按钮样式类由 './index.ts' 中的 buttonVariants() 函数生成
  - 实际样式定义在 Tailwind 配置中，基于 CSS 变量实现主题适配

  【使用示例】
  <Button>默认按钮</Button>
  <Button variant="destructive">删除</Button>
  <Button variant="outline" size="sm">小按钮</Button>
  <Button variant="ghost" size="icon">
    <Icon name="plus" />
  </Button>

  【注意事项】
  - 本组件为无状态组件，不管理内部状态
  - 点击行为由根元素的原生行为或 as 属性指定的组件决定
  - class 属性会与 variant/size 生成的类名合并，通过 cn() 函数处理冲突
-->
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { Primitive, type PrimitiveProps } from 'radix-vue'
import { type ButtonVariants, buttonVariants } from '.'
import { cn } from '@/lib/utils'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
