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
          <Label class="text-xs font-bold text-muted-foreground uppercase tracking-wider" for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="name@example.com"
            required
            :disabled="loading"
          />
        </div>

        <!-- 密码输入 -->
        <div class="space-y-2">
          <Label class="text-xs font-bold text-muted-foreground uppercase tracking-wider" for="password">Password</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            required
            :disabled="loading"
          />
        </div>

        <!-- 登录失败时的错误提示 -->
        <div v-if="error" class="text-destructive text-sm font-medium">
          {{ error }}
        </div>

        <!-- 登录按钮，请求中禁用并显示加载动画 -->
        <Button
          type="submit"
          class="w-full mt-2"
          :disabled="loading"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin mr-2"></span>
          {{ loading ? '登录中...' : '登录' }}
        </Button>
      </form>

      <!-- 首次使用引导清单 -->
      <WelcomeChecklist />

      <!-- 演示账号入口：快速体验，无需注册 -->
      <div class="mt-8 text-center sm:mx-auto sm:w-full sm:max-w-sm">
        <Button
          type="button"
          variant="link"
          class="text-sm text-muted-foreground"
          @click="fillDemoAccount"
        >
          使用演示账号体验
        </Button>
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// ── 视图状态 ──
// 从 composable 获取表单状态和提交方法
const { email, password, loading, error, handleLogin } = useLoginForm()

// ── 方法 ──
// 填充演示账号凭据，弹出安全提示后由用户确认才自动填充并登录
const fillDemoAccount = async () => {
  const confirmed = window.confirm(
    '这是共享演示账号，数据可能被其他用户查看或修改。建议不要输入真实个人信息。'
  )
  if (!confirmed) return
  email.value = '123456@163.com'
  password.value = '123456'
  // 凭据填充完成后自动触发登录
  await handleLogin()
}
</script>

<style scoped>
</style>
