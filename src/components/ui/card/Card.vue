<!--
/**
 * Card.vue - 卡片容器组件
 * 
 * 功能说明：
 * - 提供统一的卡片视觉容器，应用于页面各区域的卡片展示
 * - 基于 rounded-xl 圆角、border 边框、shadow 阴影构建视觉层次
 * - 支持通过 class prop 注入自定义样式类，灵活扩展
 * 
 * 样式来源：
 * - 使用 Tailwind CSS 工具类构建基础样式
 * - bg-card / text-card-foreground 使用 CSS 变量实现 light/dark 双主题适配
 * 
 * 使用方式：
 * ```vue
 * <Card class="p-6">
 *   <h2>卡片标题</h2>
 *   <p>卡片内容</p>
 * </Card>
 * ```
 * 
 * 依赖：
 * - cn() 工具函数：合并 class，优先使用 props.class 自定义类
 * - HTMLAttributes 类型：约束 props.class 的类型为合法的 HTML class 属性
 */
-->
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /**
   * 可选的自定义 CSS 类名
   * 用于覆盖或扩展组件默认样式（如 padding、背景色等）
   * @example 'p-6 bg-red-50'
   */
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-xl border bg-card text-card-foreground shadow',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
