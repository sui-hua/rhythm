<template>
  <!--
    Navbar — 全局顶部导航栏，桌面端常驻可折叠，移动端常驻底部
    主要结构：桌面端导航（可折叠导航面板 + 退出按钮）、移动端导航（上下文胶囊 + 底部导航 + 退出按钮）
  -->

  <!-- 桌面端导航开始：常驻可折叠导航栏，固定在顶部居中 -->
  <div class="fixed top-0 left-0 right-0 z-200 hidden md:block">
    <!-- 导航面板：默认可见，支持最小化/展开切换 -->
    <nav class="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-background/80 backdrop-blur-xl border border-border rounded-full pl-2 pr-2 py-2 shadow-2xl shadow-black/5 transition-all duration-300 ease-in-out">
      <div class="flex items-center gap-1">
        <!-- 最小化状态：仅显示图标 -->
        <template v-if="desktopCollapsed">
          <Button
            v-for="item in navItems"
            :key="item.path"
            variant="ghost"
            size="icon"
            @click="router.push(item.path)"
            :class="cn(
              'rounded-full w-9 h-9 transition-all duration-300',
              isActive(item)
                ? 'bg-black text-white shadow-lg hover:bg-foreground hover:text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )"
          >
            <component :is="item.icon" class="w-4 h-4" />
          </Button>
          <!-- 展开按钮：最小化状态下显示在导航项右侧 -->
          <button
            class="ml-1 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            @click="desktopCollapsed = false"
            title="展开导航栏"
          >
            <ChevronDown class="w-4 h-4" />
          </button>
        </template>

        <!-- 展开状态：显示完整导航项 + 最小化按钮 -->
        <template v-else>
          <!-- 上下文导航区：月/日页面时显示左侧快捷返回及切换控件 -->
          <Transition name="nav-context">
            <div v-if="contextInfo.show" class="flex items-center gap-2 px-4 pr-6 border-r border-border mr-2 overflow-hidden">
              <template v-if="contextInfo.mode === 'month'">
                <button
                    @click="router.push(contextInfo.backPath)"
                    class="text-[12px] font-black uppercase tracking-widest italic whitespace-nowrap hover:bg-muted px-3 py-1 rounded-md transition-colors mx-1"
                  >
                    {{ contextInfo.title }}
                  </button>

              </template>

              <template v-else-if="contextInfo.mode === 'day'">
                <div class="flex items-center gap-1">
                   <Button
                    variant="ghost"
                    size="icon"
                    @click="router.push(contextInfo.prevDayPath)"
                    class="w-8 h-8 rounded-full hover:bg-foreground hover:text-background transition-all"
                  >
                    <ArrowLeft class="w-4 h-4" />
                  </Button>

                  <button
                    @click="router.push(contextInfo.monthPath)"
                    class="text-[12px] font-black uppercase tracking-widest italic whitespace-nowrap hover:bg-muted px-3 py-1 rounded-md transition-colors mx-1"
                  >
                    {{ contextInfo.title }}
                  </button>

                   <Button
                    variant="ghost"
                    size="icon"
                    @click="router.push(contextInfo.nextDayPath)"
                    class="w-8 h-8 rounded-full hover:bg-foreground hover:text-background transition-all transform rotate-180"
                  >
                    <ArrowLeft class="w-4 h-4" />
                  </Button>
                </div>
              </template>
            </div>
          </Transition>

          <Button
            v-for="item in navItems"
            :key="item.path"
            variant="ghost"
            size="sm"
            @click="router.push(item.path)"
            :class="cn(
              'rounded-full px-6 h-10 text-xs font-black uppercase tracking-[0.2em] transition-all duration-500',
              isActive(item)
                ? 'bg-black text-white shadow-lg hover:bg-foreground hover:text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )"
          >
            <component :is="item.icon" class="w-3.5 h-3.5 mr-2" />
            {{ item.name }}
          </Button>

          <!-- 最小化按钮：展开状态下显示在导航项最右侧 -->
          <button
            class="ml-1 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            @click="desktopCollapsed = true"
            title="最小化导航栏"
          >
            <ChevronUp class="w-4 h-4" />
          </button>
        </template>
      </div>

    </nav>

    <!-- 桌面端退出按钮：常驻显示 -->
    <button
      class="fixed top-6 right-6 z-210 w-11 h-11 bg-background/90 backdrop-blur-xl border border-border rounded-full shadow-2xl shadow-black/5 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
      @click="handleLogout"
    >
      <LogOut class="w-4 h-4" />
    </button>
  </div>

  <!-- 桌面端导航结束 -->

  <!-- 移动端导航开始：常驻显示 -->
  <div class="md:hidden">
    <!-- 移动端上下文胶囊：月/日页面时显示在顶部居中 -->
    <div
      v-if="contextInfo.show"
      class="fixed top-3 left-1/2 -translate-x-1/2 z-200 pointer-events-auto"
    >
      <div class="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-xl border border-border rounded-full shadow-2xl shadow-black/5">
        <template v-if="contextInfo.mode === 'month'">
          <button
            @click="router.push(contextInfo.backPath)"
            class="text-[11px] font-black uppercase tracking-widest italic whitespace-nowrap hover:bg-muted px-3 py-1 rounded-md transition-colors"
          >
            {{ contextInfo.title }}
          </button>
        </template>

        <template v-else-if="contextInfo.mode === 'day'">
          <Button
            variant="ghost"
            size="icon"
            @click="router.push(contextInfo.prevDayPath)"
            class="w-8 h-8 rounded-full hover:bg-foreground hover:text-background transition-all"
          >
            <ArrowLeft class="w-4 h-4" />
          </Button>

          <button
            @click="router.push(contextInfo.monthPath)"
            class="text-[11px] font-black uppercase tracking-widest italic whitespace-nowrap hover:bg-muted px-3 py-1 rounded-md transition-colors"
          >
            {{ contextInfo.title }}
          </button>

          <Button
            variant="ghost"
            size="icon"
            @click="router.push(contextInfo.nextDayPath)"
            class="w-8 h-8 rounded-full hover:bg-foreground hover:text-background transition-all transform rotate-180"
          >
            <ArrowLeft class="w-4 h-4" />
          </Button>
        </template>
      </div>
    </div>

    <!-- 移动端底部导航栏：固定在屏幕底部居中 -->
    <nav class="fixed bottom-4 left-1/2 -translate-x-1/2 z-200 flex items-center gap-1 bg-background/90 backdrop-blur-xl border border-border rounded-full px-2 py-2 shadow-2xl shadow-black/5 pointer-events-auto">
      <Button
        v-for="item in navItems"
        :key="item.path"
        variant="ghost"
        size="icon"
        @click="router.push(item.path)"
        :class="cn(
          'rounded-full w-11 h-11 transition-all duration-300',
          isActive(item)
            ? 'bg-black text-white shadow-lg hover:bg-foreground hover:text-background'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )"
      >
        <component :is="item.icon" class="w-4 h-4" />
      </Button>

    </nav>

    <!-- 移动端退出按钮：固定在右上角 -->
    <button
      class="fixed top-3 right-3 z-200 w-11 h-11 bg-background/90 backdrop-blur-xl border border-border rounded-full shadow-2xl shadow-black/5 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all pointer-events-auto"
      @click="handleLogout"
    >
      <LogOut class="w-4 h-4" />
    </button>
  </div>
</template>

<script lang="ts" setup>
/**
 * Navbar — 全局顶部导航栏组件
 * 数据流：路由路径 → contextInfo（上下文导航状态）→ 模板渲染
 * 桌面端常驻可折叠（最小化仅显示图标），移动端常驻底部导航
 */

// ── 依赖导入 ──
import { computed, ref, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Compass, LayoutGrid, ArrowLeft, BookOpen, LogOut, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import supabase from '@/services/supabase'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { buildDayPath, buildMonthPath, buildYearPath, getRouteDateContext } from '@/views/day/utils/routeDateContext'

// ── Store ──
const dateStore = useDateStore()

// ── 路由 ──
const router = useRouter()
const route = useRoute()

// ── 状态 ──
// 桌面端导航栏是否最小化（仅显示图标），默认展开
const desktopCollapsed = ref(false)

// ── 计算属性 ──
// 导航栏菜单配置，使用 computed 确保跨午夜后路径自动更新
const navItems = computed(() => [
  { name: '时序 ', path: buildDayPath(new Date()), icon: LayoutGrid, base: '/day' },
  { name: '习惯', path: '/habits', icon: CheckCircle2, base: '/habits' },
  { name: '所向 ', path: '/direction', icon: Compass, base: '/direction' },
  { name: '总结', path: '/summary', icon: BookOpen, base: '/summary' },
])

interface NavItem {
  name: string
  path: string
  icon: Component
  base: string
}

// ── 方法 ──
// 判断导航项是否激活，时序模块拥有多层级路由（day/month/year），处在任何一层都算激活
const isActive = (item: NavItem) => {
  if (item.base === '/day' && (route.path.startsWith('/month') || route.path.startsWith('/day') || route.path.startsWith('/year'))) return true
  return route.path === item.path || route.path.startsWith(item.base)
}

// ── 计算属性 ──
// 根据当前路由计算导航栏左侧的上下文导航控件状态（月视图显示年份返回，日视图显示前后切换）
const contextInfo = computed(() => {
  const path = route.path
  const { year: currentYear, month, date: currentDate } = getRouteDateContext(route.params, dateStore.currentDate)

  // 月视图模式：显示年份返回按钮
  if (path.startsWith('/month/')) {
    return {
      title: `${currentYear}年`,
      backPath: buildYearPath(currentYear),
      show: true,
      mode: 'month' as const
    }
  }
  // 日视图模式：显示月份名称 + 前后天切换按钮
  if (path === '/day' || path.startsWith('/day/')) {
    // 构建前一天路径，用于左箭头导航
    const prevDate = new Date(currentDate)
    prevDate.setDate(currentDate.getDate() - 1)
    const prevDayPath = buildDayPath(prevDate)

    // 构建后一天路径，用于右箭头导航
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + 1)
    const nextDayPath = buildDayPath(nextDate)

    return {
      title: getMonthName(month, 'en'),
      monthPath: buildMonthPath(currentYear, month),
      prevDayPath,
      nextDayPath,
      show: true,
      mode: 'day' as const
    }
  }
  // 其他页面不显示上下文导航
  return { show: false, mode: null as null }
})

// ── 方法 ──
// 退出登录，清除 Supabase 会话后自动由路由守卫重定向到登录页
const handleLogout = async () => {
  await supabase.auth.signOut()
}
</script>

<style scoped>
/* 导航栏左侧面包屑区域的展开/收起过渡 */
.nav-context-enter-active,
.nav-context-leave-active {
  transition: max-width 0.4s ease, opacity 0.3s ease, margin 0.4s ease, padding 0.4s ease;
}
.nav-context-enter-from,
.nav-context-leave-to {
  max-width: 0;
  opacity: 0;
  margin: 0;
  padding-left: 0;
  padding-right: 0;
}
.nav-context-enter-to,
.nav-context-leave-from {
  max-width: 300px;
  opacity: 1;
}
</style>
