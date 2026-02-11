<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    <Navbar />
    <RouterView v-slot="{ Component }">
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import supabase from './config/supabase'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()

// 根据路由路径选择过渡效果
const transitionName = computed(() => {
  const path = route.path
  if (path.includes('/day')) {
    return 'view-slide'
  } else {
    return 'view-fade'
  }
})

onMounted(async () => {
  try {
    // Pinia persisted plugin hydrates the store; check if we already have a user
    if (authStore.userId) {
      console.log('Loaded user from persisted store:', authStore.userId)
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user && userData.user.id !== authStore.userId) {
          authStore.setUser(userData.user)
        }
      } catch (e) {
        console.warn('User verification failed:', e)
      }
    } else {
      // No stored user, perform sign-in (this app uses a test account by default)
      const {data, error} = await supabase.auth.signInWithPassword({
        email: 'sizhanfeng1012@163.com',
        password: 'szf1012wzs'
      })

      if (error) {
        console.error('Login failed:', error)
        return
      }

      // 获取并保存当前用户信息
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) {
          console.error('Failed to get user:', userError)
          return
        }
        if (userData?.user) {
          authStore.setUser(userData.user)
          console.log('User logged in and stored:', userData.user.id)
        }
      } catch (e) {
        console.error('Auth error:', e)
      }
    }
  } finally {
    // no-op: loading state removed from auth store
  }
})
</script>

<style scoped>
/* 视图转场动画 */
.view-fade-enter-active, .view-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.view-fade-enter-from, .view-fade-leave-to {
  opacity: 0;
  filter: blur(20px);
}

.view-slide-enter-active, .view-slide-leave-active {
  transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}
.view-slide-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.view-slide-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

/* 通用样式 */
.grid-rows-6 {
  grid-template-rows: repeat(6, minmax(0, 1fr));
}

/* 深度排版优化 */
h3, h4 {
  letter-spacing: -0.05em;
}

/* 隐藏滚动条 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
