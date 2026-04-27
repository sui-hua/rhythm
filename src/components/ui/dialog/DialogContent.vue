<script setup lang="ts">
/**
 * DialogContent.vue - 对话框内容组件
 *
 * 基于 Radix Vue 的 DialogContent 封装，提供了带有遮罩层的模态对话框内容区域。
 * 主要功能：
 * - 使用 DialogPortal 组件将内容传送到 body 末尾，避免 z-index 层级问题
 * - 使用 DialogOverlay 创建半透明黑色遮罩背景
 * - 使用 DialogContent 显示可聚焦、可访问的对话框内容
 * - 包含内置的关闭按钮（DialogClose）和过渡动画
 *
 * @see https://www.radix-vue.com/components/dialog.html
 */
import { type HTMLAttributes, computed } from 'vue'
// Radix Vue 提供的 Dialog 相关组件和 hooks
// - DialogClose: 关闭按钮组件
// - DialogContent: 对话框内容组件（核心）
// - DialogContentEmits/DialogContentProps: 类型定义
// - DialogOverlay: 遮罩层组件
// - DialogPortal: 传送门组件，将内容渲染到 body 末尾
// - useForwardPropsEmits: 组合式 hook，用于转发 props 和 emits
import {
  DialogClose,
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue'
// Lucide 图标库中的 X 图标，用于关闭按钮
import { X } from 'lucide-vue-next'
// 项目内的 className 合并工具函数，类似于 clsx + tailwind-merge
import { cn } from '@/lib/utils'

// 定义组件接受的 props，组合了 DialogContentProps 和可选的 class 属性
const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>()
// 定义组件发出的事件
const emits = defineEmits<DialogContentEmits>()

// 计算属性：分离 class 属性和其他 props
// 这样可以将 class 单独传递给 cn() 处理，其余 props 转发给 Radix 组件
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

// 使用 Radix 提供的 hook 组合转发 props 和 emits
// 这样 DialogContent 组件可以正确接收父组件传递的 v-model 等绑定
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <!-- DialogPortal: 将对话框传送到 body 末尾，避免 z-index 层级冲突 -->
  <DialogPortal>
    <!-- DialogOverlay: 遮罩层，固定定位覆盖整个视口 -->
    <!-- 样式说明： -->
    <!-- - fixed inset-0: 固定定位，填充整个视口 -->
    <!-- - z-50: 确保遮罩在最上层 -->
    <!-- - bg-black/80: 80% 透明度的黑色背景 -->
    <!-- - data-[state=open]:animate-in/data-[state=closed]:animate-out: 打开/关闭时的过渡动画 -->
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <!-- DialogContent: 对话框主体内容 -->
    <!-- v-bind="forwarded": 转发所有 props 和事件（支持 v-model:open 等）-->
    <!-- 样式说明： -->
    <!-- - fixed left-1/2 top-1/2: 固定定位，中心点对齐 -->
    <!-- - z-50: 遮罩层之上 -->
    <!-- - grid w-full max-w-lg: 网格布局，最大宽度 32rem -->
    <!-- - -translate-x-1/2 -translate-y-1/2: 自身偏移实现居中 -->
    <!-- - gap-4 border p-6 shadow-lg: 间距、边框、阴影 -->
    <!-- - sm:rounded-lg: 小屏幕以上圆角 -->
    <!-- - data-[state=*]: 各种状态触发的动画 -->
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98 sm:rounded-lg',
          props.class,
        )
      "
    >
      <!-- 默认插槽，用于放置对话框内容 -->
      <slot />

      <!-- DialogClose: 内置关闭按钮，固定在右上角 -->
      <!-- 样式说明： -->
      <!-- - absolute right-4 top-4: 绝对定位右上角 -->
      <!-- - rounded-sm: 小圆角 -->
      <!-- - opacity-70 -> hover:opacity-100: 默认 70% 透明度，悬停时 100% -->
      <!-- - focus:ring-*: 焦点时的 ring 样式 -->
      <!-- - disabled:pointer-events-none: 禁用时不可点击 -->
      <!-- - data-[state=open]:bg-accent: 打开状态时的背景色 -->
      <DialogClose
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <!-- X 图标，尺寸 4 -->
        <X class="h-4 w-4" />
        <!-- 屏幕阅读器专用文本，视觉上隐藏 -->
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
