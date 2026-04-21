<script setup lang="ts">
/*
PopoverContent.vue - 弹出层内容组件

功能说明：
  - 基于 Radix Vue 的 PopoverContent 封装组件
  - 使用 PopoverPortal 端口传输实现，将弹出层内容渲染到 body 末尾
  - 支持通过 props 和 emits 与父组件进行双向数据传递
  - 支持通过 $attrs 传递额外 HTML 属性
  - 支持自定义 class 覆盖默认样式

样式说明：
  - 默认样式：z-50、圆角边框、阴影、背景色等
  - 动画支持：data-[state=open/closed] 控制淡入淡出和缩放动画
  - 位置动画：data-[side=bottom/left/right/top] 控制各方向的滑入动画

依赖组件：
  - PopoverPortal：Radix Vue 端口传输组件
  - PopoverContent：Radix Vue 弹出层内容组件
  - reactiveOmit：VueUse 响应式对象工具
  - useForwardPropsEmits：Radix Vue  props 转发 Hook

Props：
  - align：弹出层对齐方式，默认 "center"
  - sideOffset：弹出层偏移量，默认 4
  - class：自定义 CSS 类名

Emits：
  - 继承自 PopoverContentEmits，由 Radix Vue 定义
*/
import type { PopoverContentEmits, PopoverContentProps } from "radix-vue"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  PopoverContent,
  PopoverPortal,
  useForwardPropsEmits,
} from "radix-vue"
import { cn } from "@/lib/utils"

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes["class"] }>(),
  {
    align: "center",
    sideOffset: 4,
  },
)
const emits = defineEmits<PopoverContentEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class,
        )
      "
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
