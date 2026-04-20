<template>
  <button class="rounded-3xl border border-border bg-card px-4 py-4 text-left" @click="$emit('launch')">
    <p class="text-sm font-semibold text-foreground">{{ title }}</p>
    <p class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
  </button>
</template>

<!--
  SummaryLaunchCard.vue - 总结启动卡片组件

  功能说明：
  本组件用于在总结页面提供一个触发总结生成的入口按钮。用户点击后触发 'launch' 事件，
  由父组件负责实际执行总结生成的业务逻辑。

  使用方式：
  <SummaryLaunchCard
    title="发起今日总结"
    description="从今天的执行记录里提取内容"
    @launch="handleLaunch"
  />

  Props：
  - title: String - 卡片标题，默认为"发起今日总结"
  - description: String - 卡片描述文字，默认为"从今天的执行记录里提取内容"

  事件：
  - launch: 点击按钮时触发，用于通知父组件开始生成总结
-->
<script setup>
defineProps({
  title: { type: String, default: '发起今日总结' },
  description: { type: String, default: '从今天的执行记录里提取内容' }
})
defineEmits(['launch'])
</script>
