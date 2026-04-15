/**
 * 登录表单 Composable
 * 封装登录逻辑：表单状态、Supabase 认证、路由跳转
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

  /**
   * 处理登录提交：调用 Supabase 认证，成功后更新 authStore 并跳转首页
   */
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
