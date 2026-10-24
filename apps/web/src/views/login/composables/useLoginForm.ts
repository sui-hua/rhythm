/**
 * ============================================
 * 登录表单逻辑 (views/login/composables/useLoginForm.ts)
 * ============================================
 *
 * 【模块职责】
 * - 处理用户登录逻辑
 * - 调用 Supabase Auth 进行邮箱密码登录
 * - 登录成功后更新 authStore 并跳转首页
 *
 * 【表单字段】
 * - email: 登录邮箱
 * - password: 登录密码
 *
 * 【登录流程】
 * 1. 调用 supabase.auth.signInWithPassword()
 * 2. 成功 -> authStore.setUser() -> router.push('/')
 * 3. 失败 -> 显示错误信息
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import supabase from '@/services/supabase'

// useLoginForm composable 的返回值接口
export interface UseLoginFormReturn {
  email: Ref<string>
  password: Ref<string>
  loading: Ref<boolean>
  error: Ref<string>
  handleLogin: () => Promise<void>
}

/**
 * 登录表单逻辑 composable
 *
 * 管理登录表单状态，处理 Supabase Auth 登录流程，
 * 登录成功后更新 authStore 并跳转首页。
 *
 * @returns 登录表单的状态和操作方法
 */
export const useLoginForm = (): UseLoginFormReturn => {
  const router = useRouter()
  const authStore = useAuthStore()

  // 登录邮箱
  const email: Ref<string> = ref('123456@163.com')
  // 登录密码
  const password: Ref<string> = ref('123456')
  // 登录请求 loading 状态
  const loading: Ref<boolean> = ref(false)
  // 登录错误提示信息
  const error: Ref<string> = ref('')

  // 执行登录操作
  const handleLogin = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = ''

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })

      if (signInError) {
        error.value = '登录失败，请检查邮箱和密码'
        console.error(signInError)
        return
      }

      if (data.user) {
        authStore.setUser(data.user)
        router.push('/')
      }
    } catch (err) {
      error.value = '发生未预期的错误'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  return {
    email,
    password,
    loading,
    error,
    handleLogin
  }
}
