/**
 * Sonner Toast 通知组件封装
 * 
 * 基于 vue-sonner 库封装的 Toast 通知组件，提供统一的弹窗提示体验。
 * 支持多种通知类型（成功、错误、警告、信息、加载中），并集成 lucide-vue-next 图标库。
 * 
 * @remarks
 * - 接收 ToasterProps 所有属性，支持自定义配置
 * - 内部处理 toastOptions，通过 reactiveOmit 分离自定义选项
 * - 使用 Tailwind CSS 类名实现深色/浅色主题适配
 * - 图标使用 lucide-vue-next 保持项目图标风格统一
 * 
 * @example
 * <Sonner :rich-colors="true" :expand="false" />
 */
<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { reactiveOmit } from "@vueuse/core"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "lucide-vue-next"
import { Toaster as Sonner } from "vue-sonner"

// 组件属性定义，接收 vue-sonner 的所有 ToasterProps
const props = defineProps<ToasterProps>()

// 排除 toastOptions，将剩余属性传递给 Sonner 组件
// reactiveOmit 创建响应式对象并移除指定键
const delegatedProps = reactiveOmit(props, "toastOptions")
</script>

<template>
  <!--
    Sonner Toast 根容器
    - class="toaster group": 启用 Tailwind group 语法用于嵌套样式
    - toast-options: 自定义各状态下的 Tailwind 类名，实现主题适配
  -->
  <Sonner
    class="toaster group"
    :toast-options="{
      classes: {
        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }"
    v-bind="delegatedProps"
  >
    <!-- 成功状态图标 -->
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>

    <!-- 信息状态图标 -->
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>

    <!-- 警告状态图标 -->
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>

    <!-- 错误状态图标 -->
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>

    <!-- 加载中状态图标 -->
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>

    <!-- 关闭按钮图标 -->
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>
