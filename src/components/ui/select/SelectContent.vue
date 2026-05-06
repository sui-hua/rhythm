/**
 * SelectContent.vue - 下拉选择框内容区域组件
 * 
 * 功能说明：
 * - 渲染下拉选择框的弹出内容区域
 * - 使用 SelectPortal 将内容渲染到 body 层级，避免层级冲突
 * - 支持 popper（浮动定位）和 inline（内联定位）两种定位模式
 * - 内置滚动按钮，适用于选项较多时的滚动导航
 * 
 * 样式特点：
 * - 使用 Tailwind 原子化类名定义基础样式
 * - 支持暗色主题（bg-popover, text-popover-foreground）
 * - 定义了丰富的动画过渡效果（fade, zoom, slide）
 * - popper 定位模式下自动计算偏移量
 * 
 * @see https://reka-ui.com/docs/select
 */
<script setup lang="ts">
import type { SelectContentEmits, SelectContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  SelectContent,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "@/lib/utils"
import { SelectScrollDownButton, SelectScrollUpButton } from "."

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes["class"]; disablePortal?: boolean }>(),
  {
    position: "popper",
    disablePortal: false,
  },
)
const emits = defineEmits<SelectContentEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SelectPortal :disabled="disablePortal">
    <SelectContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn(
        'relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper'
          && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        props.class,
      )
      "
      :style="{ width: 'var(--reka-select-trigger-width)' }"
      :disable-outside-pointer-events="false"
    >
      <SelectScrollUpButton />
      <SelectViewport :class="cn('p-1', position === 'popper' && 'h-[--reka-select-trigger-height] w-full')">
        <slot />
      </SelectViewport>
      <SelectScrollDownButton />
    </SelectContent>
  </SelectPortal>
</template>
