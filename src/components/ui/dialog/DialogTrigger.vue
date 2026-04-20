<!--
/**
 * DialogTrigger.vue - 对话框触发器包装组件
 *
 * 该组件是 Radix Vue DialogTrigger 的 Vue 封装，用于在应用中触发对话框（Dialog）的打开操作。
 * 通常作为对话框的入口点使用，包裹触发按钮或其他交互元素。
 *
 * 工作原理：
 * - 接收 Radix DialogTrigger 的所有 props，并透传给孩子组件
 * - 当用户与包裹的内容交互时，自动触发关联的 Dialog 打开
 *
 * 使用示例：
 * ```vue
 * <Dialog>
 *   <DialogTrigger>打开对话框</DialogTrigger>
 *   <DialogContent>对话框内容</DialogContent>
 * </Dialog>
 * ```
 *
 * @see https://www.radix-vue.com/components/dialog.html#dialogtrigger
 */-->
<script setup lang="ts">
import { DialogTrigger, type DialogTriggerProps } from 'radix-vue'

/**
 * 组件 Props - 透传 Radix DialogTrigger 的所有属性
 * @typedef {DialogTriggerProps} DialogTriggerProps
 * @property {any} [asChild] - 是否将行为传递给子元素，默认为 true
 * @property {boolean} [disabled] - 是否禁用触发器
 */
const props = defineProps<DialogTriggerProps>()
</script>

<template>
  <!--
    Radix DialogTrigger 组件
    - v-bind="props" 将所有 props 透传到 Radix 组件
    - <slot /> 渲染触发器内部的默认插槽内容（如按钮）
  -->
  <DialogTrigger v-bind="props">
    <slot />
  </DialogTrigger>
</template>
