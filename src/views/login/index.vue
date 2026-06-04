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

      <!-- 演示账号入口 -->
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
import { useLoginForm } from '@/views/login/composables/useLoginForm'
import WelcomeChecklist from '@/views/login/components/WelcomeChecklist.vue'

const { email, password, loading, error, handleLogin } = useLoginForm()

// 一键填充演示账号，避免明文暴露凭据
const fillDemoAccount = () => {
  email.value = '123456@163.com'
  password.value = '123456'
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
