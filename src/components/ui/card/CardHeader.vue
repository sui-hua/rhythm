<script setup lang="ts">
/**
 * CardHeader.vue - 卡片头部组件
 *
 * 功能说明：
 * - 提供卡片顶部的标准布局容器，采用垂直flex布局（flex-col）
 * - 默认包含适当的内边距（p-6）和垂直间距（space-y-1.5）
 * - 支持通过 class 属性注入自定义样式，实现样式扩展
 *
 * 使用场景：
 * - 作为 Card 组件的子组件，配合 CardContent、CardFooter 使用
 * - 用于放置卡片标题、描述等头部信息
 *
 * Props：
 * - class?: HTMLAttributes['class'] - 可选的额外CSS类名，用于自定义样式
 *
 * 插槽：
 * - 默认插槽：放置卡片头部内容（如标题、描述等）
 *
 * 依赖：
 * - cn(): 合并Tailwind类名的工具函数
 */
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex flex-col space-y-1.5 p-6', props.class)">
    <slot />
  </div>
</template>
