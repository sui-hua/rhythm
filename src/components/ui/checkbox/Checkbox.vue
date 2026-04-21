<script setup lang="ts">
/**
 * Checkbox 复选框组件
 *
 * 基于 Radix UI 的 Checkbox primitives 构建，提供无障碍的原生复选框功能。
 *
 * @description
 * 该组件实现了一个圆形复选框，支持以下特性：
 * - 完全支持 Vue 3 Composition API 和 script setup 语法
 * - 集成 Radix Vue 的 CheckboxIndicator 和 CheckboxRoot 组件
 * - 使用 Lucide 图标库中的 Check 图标作为选中态指示器
 * - Tailwind CSS 样式，包含聚焦、悬停、禁用等完整状态
 * - 通过 class prop 支持自定义样式扩展
 *
 * @see {@link https://radix-vue.com/components/checkbox.html Radix Vue Checkbox}
 * @see {@link https://lucide.dev/icons/check Lucide Check Icon}
 */
import { type HTMLAttributes, computed } from 'vue'
import type { CheckboxRootEmits, CheckboxRootProps } from 'radix-vue'
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

// Props 定义：接收 Radix CheckboxRoot 的所有原生 props，以及可选的 class 用于自定义样式
const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
// Emits 定义：透传 Radix CheckboxRoot 的所有原生事件
const emits = defineEmits<CheckboxRootEmits>()

/**
 * 计算属性：分离 class 属性与其他 props
 *
 * @description
 * 将 props 中的 `class` 属性提取出来，剩下的属性透传给 Radix 组件。
 * 这样可以避免 class 属性冲突，同时保持其他 props 正常传递。
 *
 * @returns 返回不含 class 的 props 对象，用于透传
 */
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

/**
 * 转发 props 和 emits 给子组件
 *
 * @description
 * 使用 Radix Vue 提供的 `useForwardPropsEmits` 工具，将分离后的 props
 * 和 emits 转发给 CheckboxRoot 组件，实现 props 的透传。
 */
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer h-6 w-6 shrink-0 rounded-full border border-zinc-200 ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white hover:border-zinc-400 group',
        props.class,
      )
    "
  >
    <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current animate-in zoom-in-50 duration-200">
      <slot>
        <Check class="h-3.5 w-3.5 stroke-[4]" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
