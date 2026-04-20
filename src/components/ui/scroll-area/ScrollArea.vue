/**
 * ScrollArea - 可滚动区域组件
 *
 * 基于 Radix UI ScrollArea 封装的自定义滚动区域组件，提供跨浏览器的原生滚动体验。
 *
 * 功能特性：
 * - 使用原生滚动机制，性能优异
 * - 自动处理滚动条样式的视觉一致性
 * - 支持垂直方向滚动
 * - 圆角边框继承机制
 * - 暴露 viewport 元素引用供父组件访问
 *
 * 组件结构：
 * - ScrollAreaRoot: 根容器，处理 overflow 和基础样式
 * - ScrollAreaViewport: 视口容器，内容实际渲染区域
 * - ScrollAreaScrollbar: 滚动条组件，垂直方向
 * - ScrollAreaThumb: 滚动条滑块
 * - ScrollAreaCorner: 滚动条角落装饰（防止内容被滚动条遮挡）
 *
 * @example
 * <ScrollArea class="h-[200px]">
 *   <div>长内容...</div>
 * </ScrollArea>
 *
 * @see https://www.radix-ui.com/primitives/docs/components/scroll-area
 */
<script setup lang="ts">
import { type HTMLAttributes, computed, ref } from 'vue'
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  type ScrollAreaRootProps,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<ScrollAreaRootProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const viewport = ref(null)

defineExpose({
  viewportElement: computed(() => viewport.value?.$el)
})
</script>

<template>
  <ScrollAreaRoot
    v-bind="delegatedProps"
    :class="cn('relative overflow-hidden', props.class)"
  >
    <ScrollAreaViewport ref="viewport" class="h-full w-full rounded-[inherit]">
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      orientation="vertical"
      class="flex touch-none select-none transition-colors"
    >
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
