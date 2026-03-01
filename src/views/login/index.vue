<template>
  <div class="min-h-screen w-full bg-white flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="flex flex-col space-y-2 text-center mb-8">
        <h1 class="text-2xl font-black tracking-tighter">登录</h1>
        <p class="text-sm text-zinc-500">请输入您的邮箱和密码进入系统</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-2">
          <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider" for="email">Email</label>
          <input 
            id="email"
            v-model="email"
            type="email" 
            placeholder="name@example.com"
            required
            class="w-full px-3 py-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
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
            class="w-full px-3 py-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            :disabled="loading"
          >
        </div>

        <div v-if="error" class="text-red-500 text-sm font-medium">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="w-full bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed h-10 rounded-md font-medium transition-colors mt-2 flex items-center justify-center"
          :disabled="loading"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import supabase from '@/config/supabase'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
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
</script>
