<!--
/**
 * OnboardingOverlay.vue - 首次引导遮罩层组件
 * 
 * 功能说明：
 * - 当用户首次使用应用时，显示引导提示信息
 * - 使用 Vue Teleport 将遮罩层渲染到 body 元素，确保层级最高
 * - 提供「完成这一步」和「稍后再说」两个操作选项
 * 
 * 使用方式：
 * - 通过 v-if="visible" 控制显示/隐藏
 * - 监听 complete 事件：用户点击「完成这一步」后触发
 * - 监听 close 事件：用户点击「稍后再说」后触发
 * 
 * 样式特点：
 * - 遮罩层：半透明黑色背景 (bg-black/45)
 * - 弹窗：居中显示的白色卡片，圆角大边框
 * - 按钮：主按钮（深色背景）/ 次按钮（边框样式）
 */
-->
<template>
  <!--
    Teleport 组件：将内容传送到指定 DOM 节点
    to="body" - 传送到 body 元素末尾，确保遮罩层层级最高
  -->
  <Teleport to="body">
    <!--
      v-if="visible" - 仅当 visible 为 true 时显示遮罩层
      fixed inset-0 - 固定定位，铺满整个视窗
      z-[320] - 极高的 z-index，确保遮挡其他所有内容
      bg-black/45 - 半透明黑色遮罩背景
    -->
    <div v-if="visible" class="fixed inset-0 z-[320] bg-black/45">
      <!--
        引导弹窗主体
        mx-auto mt-20 - 水平居中，距顶部 5rem
        max-w-md - 最大宽度 28rem
        rounded-3xl - 大圆角 (1.5rem)
        bg-background - 使用主题背景色
        p-6 - 内边距 1.5rem
        shadow-2xl - 强阴影效果
      -->
      <div class="mx-auto mt-20 max-w-md rounded-3xl bg-background p-6 shadow-2xl">
        <!-- 引导阶段标签 -->
        <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">首次引导</p>
        
        <!-- 引导标题 - 动态传入 -->
        <h2 class="mt-2 text-xl font-semibold text-foreground">{{ title }}</h2>
        
        <!-- 引导描述文字 - 动态传入，支持多行 -->
        <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ description }}</p>
        
        <!-- 操作按钮区域 -->
        <div class="mt-6 flex gap-3">
          <!--
            主操作按钮：完成这一步
            bg-foreground text-background - 深色背景浅色文字，突出显示
            @click="$emit('complete')" - 点击后触发 complete 事件
          -->
          <button class="rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-background" @click="$emit('complete')">完成这一步</button>
          
          <!--
            次操作按钮：稍后再说
            border border-border - 边框样式，相对低调
            @click="$emit('close')" - 点击后触发 close 事件
          -->
          <button class="rounded-2xl border border-border px-4 py-2 text-sm font-medium" @click="$emit('close')">稍后再说</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * 组件属性定义
 * 
 * @prop {Boolean} visible - 控制遮罩层显示/隐藏，默认为 false（隐藏）
 * @prop {String} title - 引导步骤的标题文本
 * @prop {String} description - 引导步骤的详细描述文字
 */
defineProps({
  // 控制遮罩层是否显示，false 时完全不渲染到 DOM
  visible: { type: Boolean, default: false },
  // 引导步骤的标题
  title: { type: String, default: '' },
  // 引导步骤的详细描述，支持多行文本
  description: { type: String, default: '' }
})

/**
 * 组件事件定义
 * 
 * @event complete - 用户点击「完成这一步」按钮时触发
 * @event close - 用户点击「稍后再说」按钮时触发
 */
defineEmits(['complete', 'close'])
</script>
