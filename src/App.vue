<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    <Toaster />
    <GlobalLoadingBar />
    <Navbar v-if="authStore.userId && !uiStore.navbarHidden" />
    <RouterView v-slot="{ Component }">
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import GlobalLoadingBar from '@/components/ui/GlobalLoadingBar.vue'
import { Toaster } from '@/components/ui/sonner'
import supabase from './config/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { useNotifications } from '@/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

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
    // 检查是否有现有 session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('获取 session 失败:', error)
      return
    }

    if (session?.user) {
      authStore.setUser(session.user)
      // 请求通知权限
      const { requestPermission } = useNotifications()
      requestPermission()
    } else {
      // 当前没有登录用户
      authStore.clearAuth()
      if (route.path !== '/login') {
        router.push('/login')
      }
    }

    // 监听 Auth 状态变化（在多标签页、或登出/重新登录时触发）
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        authStore.setUser(session.user)
      } else {
        authStore.clearAuth()
        router.push('/login')
      }
    })
  } catch (e) {
    console.error('App 鉴权初始化错误:', e)
  }
})
</script>


<style scoped>
/* 视图转场动画 */
.view-fade-enter-active, .view-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.view-fade-enter-from {
  opacity: 0;
  transform: scale(0.98);
  filter: blur(10px);
}
.view-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
  filter: blur(10px);
}

.view-slide-enter-active, .view-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.view-slide-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.98);
}
.view-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(1.02);
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
