<template>
  <!--
    NotificationPromptCard - 通知权限引导卡片组件
    
    用途：首次引导用户开启浏览器通知权限
    - 展示简洁的说明文案，解释为何需要用户主动授权
    - 提供"开启提醒"按钮，触发父组件处理权限申请逻辑
    - 仅在用户尚未授权通知时显示（由父组件控制 v-if/v-show）
  -->
  <div class="rounded-3xl border border-border bg-card p-4">
    <!-- 标题：提醒设置 -->
    <p class="text-sm font-semibold text-foreground">提醒设置</p>
    
    <!-- 说明文案：解释通知授权流程 -->
    <!-- 
      说明用户需要主动操作才会触发权限申请，
      系统不会静默打扰，只有用户明确开启后才按设定时间推送
    -->
    <p class="mt-2 text-sm leading-6 text-muted-foreground">
      只有你主动打开提醒后，系统才会申请通知权限，并按设定时间提醒你。
    </p>
    
    <!-- 开启提醒按钮：触发 enable 事件，由父组件处理权限申请 -->
    <button
      class="mt-4 rounded-2xl bg-foreground px-4 py-2 text-sm font-medium text-background"
      @click="$emit('enable')"
    >
      开启提醒
    </button>
  </div>
</template>

<script setup>
/**
 * NotificationPromptCard Component
 * 
 * @description
 * 通知权限引导卡片组件，用于引导用户开启浏览器通知权限。
 * 采用用户主动触发模式而非静默申请，提升用户体验和授权通过率。
 * 
 * @emit enable - 用户点击"开启提醒"按钮时触发，父组件应调用 Notification.requestPermission() 并执行后续设置逻辑
 * 
 * @example
 * <NotificationPromptCard @enable="handleEnableNotifications" />
 */
defineEmits(['enable'])
</script>
