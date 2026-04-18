/**
 * ============================================
 * 登录表单逻辑 (views/login/composables/useLoginForm.js)
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
 * 2. 成功 → authStore.setUser() → router.push('/')
 * 3. 失败 → 显示错误信息
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import supabase from '@/config/supabase'

export const useLoginForm = () => {
  const router = useRouter()
  const authStore = useAuthStore()

  const email = ref('123456@163.com')
  const password = ref('123456')
  const loading = ref(false)
  const error = ref('')

  const handleLogin = async () => {
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
