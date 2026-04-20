/**
 * SelectLabel.vue
 * ─────────────────────────────────────────────────────────────────────────────
 * 下拉选择器（Select）组件库中的「选项组标签」组件。
 *
 * 功能说明：
 *   - 作为 `<SelectGroup>` 的子元素，用于显示选项组的标题/标签（如 "最常使用"、"最近使用" 等分组）。
 *   - 底层封装了 [Reka UI](https://reka-ui.web.app) 的 `SelectLabel` 组件，
 *     继承其无障碍（ARIA）属性，确保屏幕阅读器能正确识别为分组标题。
 *   - 通过 `class` prop 支持 Tailwind CSS 样式覆盖，默认内边距为 `py-1.5 pl-8 pr-2`，
 *     字体大小为 `text-sm`，字重为 `font-semibold`。
 *
 * 使用示例：
 *   ```vue
 *   <SelectGroup>
 *     <SelectLabel>最常使用</SelectLabel>
 *     <SelectItem value="...">...</SelectItem>
 *   </SelectGroup>
 *   ```
 *
 * 依赖组件（来自 reka-ui）：
 *   - SelectLabel（原子组件）
 *
 * @see https://reka-ui.web.app/docs/primitives/select
 */

<script setup lang="ts">
import type { SelectLabelProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { SelectLabel } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SelectLabelProps & { class?: HTMLAttributes["class"] }>()
</script>

<template>
  <SelectLabel :class="cn('py-1.5 pl-8 pr-2 text-sm font-semibold', props.class)">
    <slot />
  </SelectLabel>
</template>
