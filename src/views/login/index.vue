<template>
  <!--
    Login 页面 — 用户登录入口
    主要结构：登录表单、首次使用清单、演示账号入口
  -->
  <div class="min-h-screen w-full bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- 登录表单：邮箱 + 密码，提交触发 Supabase Auth -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <!-- 邮箱输入 -->
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

        <!-- 密码输入 -->
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

        <!-- 登录失败时的错误提示 -->
        <div v-if="error" class="text-red-500 text-sm font-medium">
          {{ error }}
        </div>

        <!-- 登录按钮，请求中禁用并显示加载动画 -->
        <button
          type="submit"
          class="w-full h-10 rounded-md font-medium transition-colors mt-2 flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin mr-2"></span>
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- 首次使用引导清单 -->
      <WelcomeChecklist />

      <!-- 演示账号入口：快速体验，无需注册 -->
      <div class="mt-8 text-center sm:mx-auto sm:w-full sm:max-w-sm">
        <button
          type="button"
          class="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          @click="fillDemoAccount"
        >
          使用演示账号体验
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Login 页面入口
 * 表单状态与登录逻辑委托给 useLoginForm composable
 * 数据流：useLoginForm → email/password/loading/error → 表单绑定 → handleLogin → Supabase Auth
 */

// ── 依赖导入 ──
import { useLoginForm } from '@/views/login/composables/useLoginForm'
import WelcomeChecklist from '@/views/login/components/WelcomeChecklist.vue'

// ── 视图状态 ──
// 从 composable 获取表单状态和提交方法
const { email, password, loading, error, handleLogin } = useLoginForm()

// ── 方法 ──
// 填充演示账号凭据，让用户无需注册即可体验产品
const fillDemoAccount = () => {
  email.value = '123456@163.com'
  password.value = '123456'
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
