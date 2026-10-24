<script setup lang="ts">
/**
 * DialogFooter 组件
 *
 * 用于对话框底部的操作按钮区域，提供统一的布局和样式。
 * 采用响应式设计：小屏幕时按钮垂直排列（flex-col-reverse），
 * 大屏幕（sm）及以上水平排列（flex-row）。
 *
 * @property {string} [class] - 自定义 CSS 类名，用于覆盖默认样式
 *
 * @see https://ui.rhythm.cn/dialog
 */
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
