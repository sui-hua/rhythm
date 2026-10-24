<!--
CardContent.vue - 卡片内容区域组件

功能说明：
- 提供卡片内部的主要内容容器区域
- 自动应用默认内边距（p-6）和顶部内边距重置（pt-0）
- 支持通过 class prop 注入额外的 Tailwind CSS 类名
- 使用 Vue 3 Composition API 和 <script setup> 语法
- 配合 Card、CardHeader、CardFooter 等组件构建完整卡片 UI

使用示例：
  <Card>
    <CardHeader>标题</CardHeader>
    <CardContent class="text-gray-600">主要内容</CardContent>
    <CardFooter>底部操作</CardFooter>
  </Card>

Props：
  - class?: HTMLAttributes['class'] - 可选的额外 CSS 类名，用于自定义样式或传递 Tailwind 类
-->
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  // 接收可选的 CSS 类名，用于自定义样式或扩展功能
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <!--
    容器元素：div 元素
    样式绑定：
      - 'p-6 pt-0'：应用底部和左右内边距（24px），移除顶部内边距
        （配合 CardHeader 使用时避免重复的内边距）
      - props.class：通过 cn 工具合并传入的自定义类名
    插槽：<slot /> 渲染默认插槽内容
  -->
  <div :class="cn('p-6 pt-0', props.class)">
    <slot />
  </div>
</template>
