<template>
  <!--
    根组件 — 全局布局容器，负责认证初始化和路由转场
    主要结构：全局提示、加载条、导航栏、路由视图
  -->
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground selection:bg-foreground selection:text-background relative">
    <!-- 全局 Toast 提示区 -->
    <Toaster position="top-right" />
    <!-- 全局加载进度条 -->
    <GlobalLoadingBar />
    <!-- 导航栏：已登录且未隐藏时显示 -->
    <Navbar v-if="authStore.userId && !uiStore.navbarHidden" />
    <!-- 路由视图区：固定路由容器承载进出场页面，避免切换时布局留空 -->
    <main class="route-view-host">
      <RouterView v-slot="{ Component }">
        <Transition :name="transitionName">
          <div :key="route.path" class="route-view-shell">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script lang="ts" setup>
/**
 * 根组件脚本
 * 职责：全局认证初始化、路由转场控制、导航栏渲染
 * 数据流：Supabase session → authStore → 全局状态 → UI 渲染
 */

// ── 依赖导入 ──
import { computed, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import GlobalLoadingBar from '@/components/ui/GlobalLoadingBar.vue'
import { Toaster } from '@/components/ui/sonner'
import supabase from './services/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { usePomodoroStore } from '@/stores/pomodoroStore'

// ── Store ──
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const goalDataStore = useGoalDataStore()
const goalSelectionStore = useGoalSelectionStore()
const goalBatchStore = useGoalBatchStore()
const pomodoroStore = usePomodoroStore()

// ── 计算属性 ──
// 根据目标路由路径选择过渡效果：day 路由使用滑动效果，其他使用淡入淡出
const transitionName = computed(() =>
  route.path.includes('/day') ? 'view-slide' : 'view-fade'
)

// ── 生命周期 ──
// 应用启动时初始化认证状态，监听多标签页和登出事件
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
    } else {
      // 当前没有登录用户，清除状态并重定向到登录页
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
        // 登出时清除所有业务 Store，避免残留脏数据
        // authStore: 清除用户 ID 和 token
        authStore.clearAuth()
        // Direction 模块：清空目标/月度计划/日计划缓存与选中状态
        goalDataStore.reset()
        goalSelectionStore.reset()
        goalBatchStore.reset()
        // 番茄钟：停止计时器、清空活跃任务
        pomodoroStore.reset()
        // habitStore / dayStore 无持久化状态，下次进入页面时自动重新拉取
        router.push('/login')
      }
    })
  } catch (e) {
    console.error('App 鉴权初始化错误:', e)
  }
})
</script>


<style scoped>
/* 路由视图容器：页面转场时保持新旧页面叠放，避免 out-in 造成空白帧 */
.route-view-host {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.route-view-shell {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

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
