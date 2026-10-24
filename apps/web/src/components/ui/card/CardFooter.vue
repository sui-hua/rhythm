<script setup lang="ts">
/**
 * CardFooter 组件
 *
 * 功能说明：
 * - 卡片底部的布局容器组件，提供统一的底部样式
 * - 使用 flex 布局，items-center 垂直居中
 * - 默认内边距 p-6，顶部无边距 (pt-0)
 * - 支持通过 class prop 注入额外的 CSS 类名
 *
 * 使用场景：
 * - 配合 Card 组件使用，作为卡片底部的容器
 * - 通常放置操作按钮、链接或元信息
 */
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex items-center p-6 pt-0', props.class)">
    <slot />
  </div>
</template>
