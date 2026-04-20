/**
 * WelcomeChecklist.vue
 * ─────────────────────
 * 登录欢迎页右侧新手引导清单组件。
 *
 * 功能说明：
 *   - 展示三步骤新手引导建议，帮助首次使用的用户快速了解核心功能使用顺序
 *   - 引导顺序：时序(今日节奏) → 习惯(建立稳定动作) → 所向(定义长期目标)
 *
 * 使用场景：
 *   - 位于登录页右侧面板，面向首次登录的新用户
 *   - 仅起引导提示作用，不涉及任何数据请求或用户交互
 *
 * 技术细节：
 *   - 纯展示组件，无状态、无 props、无 emits
 *   - 使用 Tailwind 样式，遵循项目 CSS 规范
 *   - 布局：圆角卡片 + 标题 + 无序列表
 */

<template>
  <div class="mt-6 rounded-3xl border border-border bg-card p-4">
    <h3 class="text-sm font-semibold text-foreground">第一次使用建议</h3>
    <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
      <li>1. 先进入时序，确认今天的执行节奏</li>
      <li>2. 再创建一个习惯，建立稳定动作</li>
      <li>3. 最后去所向定义第一个长期目标</li>
    </ul>
  </div>
</template>
