<!--
Dialog.vue - 对话框根组件

概述:
  该组件是 Radix Vue Dialog 系统的根容器封装，遵循 Headless UI 模式，
  本身不渲染额外的 UI 元素，仅作为状态管理和事件传递的桥梁。

功能:
  - 接收 DialogRoot 的所有 props 并正向传递
  - 接收 DialogRoot 的所有 emits 并正向传递
  - 透传 slot 内容给 DialogRoot

集成:
  - 使用 radix-vue 的 DialogRoot、useForwardPropsEmits
  - 被 DialogTrigger、DialogContent 等子组件配合使用
  - 通常搭配 Teleport 将对话框渲染到 body

Props:
  - 所有 DialogRootProps 类型支持的属性（详见 radix-vue）

Emits:
  - 所有 DialogRootEmits 类型支持的事件（详见 radix-vue）
-->
<script setup lang="ts">
import {
  DialogRoot,
  type DialogRootEmits,
  type DialogRootProps,
  useForwardPropsEmits,
} from 'radix-vue'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
