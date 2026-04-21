<script setup lang="ts">
/**
 * SelectGroup.vue - 下拉选择框分组组件
 *
 * 功能说明：
 * - 作为 Select 组件的分组容器，用于将多个 SelectItem 分组显示
 * - 每个分组可以拥有独立的标签（通过 SelectGroupLabel 组件）
 * - 分组之间会有视觉分隔效果
 *
 * 样式特点：
 * - 容器内边距 p-1
 * - 宽度占满父容器 w-full
 * - 可通过 class prop 添加自定义样式
 */
// 从 reka-ui 导入 SelectGroup 组件的类型定义，用于类型检查
import type { SelectGroupProps } from "reka-ui"

// 从 Vue 导入 HTML 属性类型，用于 class prop 的类型定义
import type { HTMLAttributes } from "vue"

// 从 VueUse 导入 reactiveOmit 工具函数，用于从响应式对象中排除特定属性
import { reactiveOmit } from "@vueuse/core"

// 从 reka-ui 导入 SelectGroup 基础组件，作为当前组件的包装目标
import { SelectGroup } from "reka-ui"

// 从项目工具库导入 cn 函数，用于合并 Tailwind CSS 类名
import { cn } from "@/lib/utils"

// 定义组件 props：接收 SelectGroupProps 以及可选的 class 属性
const props = defineProps<SelectGroupProps & { class?: HTMLAttributes["class"] }>()

// 将 props 中除 class 外的其他属性传递给 SelectGroup 组件
// reactiveOmit 创建响应式副本，确保变化能被追踪
const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <!--
    渲染 SelectGroup 组件：
    - cn('p-1 w-full', props.class) 添加基础样式并合并自定义 class
    - v-bind="delegatedProps" 绑定除 class 外的其他属性
  -->
  <SelectGroup :class="cn('p-1 w-full', props.class)" v-bind="delegatedProps">
    <slot />
  </SelectGroup>
</template>
