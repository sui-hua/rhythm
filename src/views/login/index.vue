<!--
  ============================================
  Login 视图 - 登录页面 (views/login/index.vue)
  ============================================

  【模块职责】
  - 用户登录页面
  - 邮箱密码登录
  - 显示访客体验账号信息

  【登录方式】
  - Supabase Auth 邮箱密码登录

  【访客体验账号】
  - 邮箱：123456@163.com
  - 密码：123456
-->
<template>
  <div class="min-h-screen w-full bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div class="space-y-2">
          <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="name@example.com"
            required
            class="w-full px-3 py-2 border border-zinc-200 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-zinc-100"
            :disabled="loading"
          >
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-3 py-2 border border-zinc-200 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-zinc-100"
            :disabled="loading"
          >
        </div>

        <div v-if="error" class="text-red-500 text-sm font-medium">
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full h-10 rounded-md font-medium transition-colors mt-2 flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin mr-2"></span>
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <WelcomeChecklist />

      <div class="mt-8 text-center sm:mx-auto sm:w-full sm:max-w-sm">
        <p class="text-sm text-zinc-500">
          访客体验账号：<span class="font-medium text-foreground">123456@163.com</span><br>
          密码：<span class="font-medium text-foreground">123456</span>
        </p>
      </div>
    </div>
  </div>
</template>

<!--
============================================================================
登录页面组件 (views/login/index.vue)
============================================================================

【文件描述】
  提供用户登录功能的主页面，采用 Vue 3 Composition API + <script setup> 语法。
  集成 Supabase Auth 进行邮箱密码认证，支持访客快速体验。

【核心功能】
  1. 邮箱/密码登录表单
  2. 登录状态管理（加载中/错误提示）
  3. 访客体验账号快速登录指引
  4. 登录成功后自动跳转至首页

【数据流】
  - 用户输入 → useLoginForm composable → Supabase Auth → authStore → 路由跳转

【依赖组件】
  - WelcomeChecklist: 欢迎清单组件，展示新用户入门步骤

【依赖 Composable】
  - useLoginForm: 封装登录表单状态和逻辑（email, password, loading, error, handleLogin）

【相关文件】
  - src/views/login/composables/useLoginForm.js  - 登录逻辑复用
  - src/views/login/components/WelcomeChecklist.vue - 欢迎清单组件
  - src/stores/authStore.js - 认证状态管理

【样式说明】
  - 使用 Tailwind CSS 4，主题 tokens 定义在 @/assets/tw-theme.css
  - 响应式设计，移动端友好的登录表单

============================================================================
-->

<script setup>
import { useLoginForm } from '@/views/login/composables/useLoginForm'
import WelcomeChecklist from '@/views/login/components/WelcomeChecklist.vue'

const { email, password, loading, error, handleLogin } = useLoginForm()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
