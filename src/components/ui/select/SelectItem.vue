/**
 * SelectItem.vue - 下拉选择项组件
 * 
 * 基于 Reka UI 的 SelectItem 组件封装的 Vue 3 单文件组件，
 * 用于 Select 组件中的每一个选项项。
 * 
 * 功能特点：
 * - 支持通过 `showCheck` 属性控制是否显示勾选指示器
 * - 当 showCheck 为 true 时，选项左侧显示 Check 图标（用于单选场景）
 * - 当 showCheck 为 false 时，选中项通过背景色区分（用于多选场景）
 * - 自动处理 disabled 状态的样式（禁止点击、降低透明度）
 * - 支持自定义 class，可覆盖默认样式
 * 
 * 使用方式：
 * ```vue
 * <SelectItem value="option1" showCheck>选项一</SelectItem>
 * <SelectItem value="option2" showCheck="false">选项二</SelectItem>
 * ```
 * 
 * @prop showCheck - 是否显示勾选图标，默认为 true
 * @prop class - 自定义类名，用于覆盖默认样式
 * @prop 其他 SelectItemProps - 透传给 Reka UI 的 SelectItem
 */

<script setup lang="ts">
import type { SelectItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Check } from "lucide-vue-next"
import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  useForwardProps,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<SelectItemProps & { class?: HTMLAttributes["class"]; showCheck?: boolean }>(),
  { showCheck: true }
)

const delegatedProps = reactiveOmit(props, "class", "showCheck")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.showCheck ? 'pl-8 pr-2' : 'justify-center data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground',
        props.class,
      )
    "
  >
    <span v-if="props.showCheck" class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
