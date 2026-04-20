<script setup lang="ts">
/**
 * DialogDescription.vue
 *
 * 对话框描述文本组件。
 *
 * 基于 Radix UI 的 DialogDescription primitive 封装，用于为对话框提供辅助文本说明。
 * 该组件继承 Radix DialogDescription 的全部功能，并通过 Tailwind 样式提供默认的
 * 辅助文本外观（较小字号、柔和的颜色），同时支持通过 class prop 自定义样式。
 *
 * @component
 * @example
 * <Dialog>
 *   <DialogTitle>确认删除</DialogTitle>
 *   <DialogDescription>此操作无法撤销，确定要继续吗？</DialogDescription>
 *   <DialogContent>
 *     <!-- 其他内容 -->
 *   </DialogContent>
 * </Dialog>
 *
 * @see https://radix-ui.com/primitives/docs/components/dialog
 */
import { type HTMLAttributes, computed } from 'vue'
import { DialogDescription, type DialogDescriptionProps } from 'radix-vue'
import { cn } from '@/lib/utils'

/**
 * 组件属性
 * 继承 Radix DialogDescriptionProps 的所有属性，并扩展 class 属性用于自定义样式。
 */
const props = defineProps<DialogDescriptionProps & { class?: HTMLAttributes['class'] }>()

/**
 * 计算属性：分离 class 属性与其他属性
 *
 * 将 props 中的 class 属性单独提取出来用于组件根元素样式绑定，
 * 剩余属性通过 v-bind 传递给 Radix DialogDescription 底层组件。
 * 这种模式允许我们在使用 class prop 自定义样式的同时，
 * 将其他所有 props 委托给 Radix 组件处理。
 *
 * @returns {Object} 移除 class 后的剩余属性对象
 */
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <DialogDescription
    v-bind="delegatedProps"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
