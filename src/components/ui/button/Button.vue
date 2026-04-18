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
