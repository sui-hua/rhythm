<template>
  <!-- 
    导航栏最外层父容器
    - group: 定义一个 hover 组，当鼠标悬停在其内部有效区域时，触发整个组的 group-hover 状态
    - pointer-events-none: 作为全宽块级元素，使其不会阻挡页面下方原有内容的点击事件
  -->
  <!-- Desktop Navbar (hover reveal) -->
  <div class="fixed top-0 left-0 right-0 h-24 z-[200] group pointer-events-none hidden md:block">
    <!-- 
      实际的导航面板
      - 默认状态:  -translate-y-[150%] (隐藏在顶部之外) 且 opacity-0 (透明)
      - 悬停状态 (group-hover): translate-y-0 opacity-100 (往下滑出并显示)
      - pointer-events-auto: 恢复本身的鼠标交互，使得内部按钮可以点击，且鼠标悬停在它身上时面板不会消失
    -->
    <nav class="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-white/80 backdrop-blur-xl border border-zinc-100 rounded-full pl-2 pr-2 py-2 shadow-2xl shadow-black/5 transition-all duration-500 ease-in-out -translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 pointer-events-auto">
    <!-- <nav class="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-white/80 backdrop-blur-xl border border-zinc-100 rounded-full pl-2 pr-2 py-2 shadow-2xl shadow-black/5 transition-all duration-500 ease-in-out translate-y-0opacity-100 pointer-events-auto"> -->
      <div class="flex items-center gap-1">
        <!-- 例如身处月或者日页面，显示左侧快捷返回及切换区域 -->
        <Transition name="nav-context">
          <div v-if="contextInfo.show" class="flex items-center gap-2 px-4 pr-6 border-r border-zinc-100 mr-2 overflow-hidden">
            <template v-if="contextInfo.mode === 'month'">
              <button 
                  @click="router.push(contextInfo.backPath)"
                  class="text-[12px] font-black uppercase tracking-widest italic whitespace-nowrap hover:bg-zinc-100 px-3 py-1 rounded-md transition-colors mx-1"
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
                  class="w-8 h-8 rounded-full hover:bg-black hover:text-white transition-all"
                >
                  <ArrowLeft class="w-4 h-4" />
                </Button>
                
                <button 
                  @click="router.push(contextInfo.monthPath)"
                  class="text-[12px] font-black uppercase tracking-widest italic whitespace-nowrap hover:bg-zinc-100 px-3 py-1 rounded-md transition-colors mx-1"
                >
                  {{ contextInfo.title }}
                </button>

                 <Button
                  variant="ghost"
                  size="icon"
                  @click="router.push(contextInfo.nextDayPath)"
                  class="w-8 h-8 rounded-full hover:bg-black hover:text-white transition-all transform rotate-180"
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
            'rounded-full px-6 h-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500',
            isActive(item) 
              ? 'bg-black text-white shadow-lg hover:bg-black hover:text-white' 
              : 'text-zinc-400 hover:text-black hover:bg-zinc-50'
          )"
        >
          <component :is="item.icon" class="w-3.5 h-3.5 mr-2" />
          {{ item.name }}
        </Button>

      </div>

    </nav>
    <!-- 
      顶部隐形触发热区 (Invisible Trigger Area)
      - 固定在最顶部的透明高 10px(h-10) 区域
      - pointer-events-auto: 恢复鼠标事件捕捉。当鼠标触碰到这个区域时，就会触发外层 div 的 group:hover 动作，从而使 nav 导航栏滑出
    -->
    <div class="absolute top-0 left-0 right-0 h-10 pointer-events-auto"></div>

    <!-- Desktop logout (top-right, reveal with navbar) -->
    <button
      class="fixed top-6 right-6 z-[210] w-11 h-11 bg-white/90 backdrop-blur-xl border border-zinc-100 rounded-full shadow-2xl shadow-black/5 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
      @click="handleLogout"
    >
      <LogOut class="w-4 h-4" />
    </button>
  </div>

  <!-- Mobile Navbar (always visible) -->
  <div class="md:hidden">
    <!-- Context pill (month/day navigation) -->
    <div
      v-if="contextInfo.show"
      class="fixed top-3 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
    >
      <div class="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-xl border border-zinc-100 rounded-full shadow-2xl shadow-black/5">
        <template v-if="contextInfo.mode === 'month'">
          <button
            @click="router.push(contextInfo.backPath)"
            class="text-[11px] font-black uppercase tracking-widest italic whitespace-nowrap hover:bg-zinc-100 px-3 py-1 rounded-md transition-colors"
          >
            {{ contextInfo.title }}
          </button>
        </template>

        <template v-else-if="contextInfo.mode === 'day'">
          <Button
            variant="ghost"
            size="icon"
            @click="router.push(contextInfo.prevDayPath)"
            class="w-8 h-8 rounded-full hover:bg-black hover:text-white transition-all"
          >
            <ArrowLeft class="w-4 h-4" />
          </Button>

          <button
            @click="router.push(contextInfo.monthPath)"
            class="text-[11px] font-black uppercase tracking-widest italic whitespace-nowrap hover:bg-zinc-100 px-3 py-1 rounded-md transition-colors"
          >
            {{ contextInfo.title }}
          </button>

          <Button
            variant="ghost"
            size="icon"
            @click="router.push(contextInfo.nextDayPath)"
            class="w-8 h-8 rounded-full hover:bg-black hover:text-white transition-all transform rotate-180"
          >
            <ArrowLeft class="w-4 h-4" />
          </Button>
        </template>
      </div>
    </div>

    <!-- Bottom nav -->
    <nav class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1 bg-white/90 backdrop-blur-xl border border-zinc-100 rounded-full px-2 py-2 shadow-2xl shadow-black/5 pointer-events-auto">
      <Button
        v-for="item in navItems"
        :key="item.path"
        variant="ghost"
        size="icon"
        @click="router.push(item.path)"
        :class="cn(
          'rounded-full w-11 h-11 transition-all duration-300',
          isActive(item)
            ? 'bg-black text-white shadow-lg hover:bg-black hover:text-white'
            : 'text-zinc-400 hover:text-black hover:bg-zinc-50'
        )"
      >
        <component :is="item.icon" class="w-4 h-4" />
      </Button>

    </nav>

    <!-- Mobile logout (top-right) -->
    <button
      class="fixed top-3 right-3 z-[200] w-11 h-11 bg-white/90 backdrop-blur-xl border border-zinc-100 rounded-full shadow-2xl shadow-black/5 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all pointer-events-auto"
      @click="handleLogout"
    >
      <LogOut class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup>
/**
 * Navbar.vue - 全局导航栏组件
 * 
 * 功能概述:
 * - 桌面端: 顶部悬停触发的隐藏式导航栏，鼠标悬停时从顶部滑出显示
 * - 移动端: 固定在底部的导航栏，始终可见
 * - 支持上下文导航: 在月视图和日视图页面显示面包屑和翻页控件
 * - 退出登录功能
 * 
 * 导航结构:
 * - 时序 (/day): 每日时间轴，支持年/月/日三级路由
 * - 习惯 (/habits): 周期行为追踪
 * - 所向 (/direction): 长期目标管理
 * - 总结 (/summary): 日/周/月/年总结
 * 
 * 桌面端交互逻辑:
 * - 顶部 10px 透明热区 (h-10) 作为触发区域，pointer-events-auto 捕获鼠标事件
 * - 外层 div 使用 group 包裹，悬停热区时触发 group-hover 状态
 * - nav 面板默认 -translate-y-[150%] + opacity-0，悬停时 translate-y-0 + opacity-100
 * - 登出按钮默认 opacity-0 scale-95，悬停时显示
 * 
 * 移动端交互逻辑:
 * - 底部固定导航栏，始终显示
 * - 上下文导航 pill 固定在顶部居中
 * - 登出按钮固定在右上角
 * 
 * 上下文导航 (contextInfo):
 * - 月视图 (/month/:year/:month): 显示年份 + 返回年视图按钮
 * - 日视图 (`/day` 与 `/day/:year/:month/:day`): 显示月份名 + 左右翻日按钮 + 返回月视图按钮
 * 
 * 依赖:
 * - vue-router: 路由导航
 * - pinia (dateStore): 日期状态管理
 * - lucide-vue-next: 图标组件
 * - @/components/ui/button: 按钮组件
 * - @/lib/utils: 工具函数 (cn)
 * - @/config/supabase: Supabase 认证
 */
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2, Compass, LayoutGrid, ArrowLeft, BookOpen, LogOut } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import supabase from '@/config/supabase'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { buildDayPath, buildMonthPath, buildYearPath, getRouteDateContext } from '@/views/day/utils/routeDateContext'

const dateStore = useDateStore()
const router = useRouter()
const route = useRoute()

// 动态获取当天的路由路径，用于进入“时序”时默认跳转
const getTodayPath = () => {
  return buildDayPath(new Date())
}

// 导航栏菜单配置
const navItems = [
  { name: '时序 ', path: getTodayPath(), icon: LayoutGrid, base: '/day' },
  { name: '习惯', path: '/habits', icon: CheckCircle2, base: '/habits' },
  { name: '所向 ', path: '/direction', icon: Compass, base: '/direction' },
  { name: '总结', path: '/summary', icon: BookOpen, base: '/summary' },
]

// 判断导航项是否激活
// 特殊情况处理：因为时序拥有多层级(年、月、日)，如果处在其中任何一层，都算“时序”处于激活状态
const isActive = (item) => {
  // 时序拥有多层级(年、月、日)，处在任何一层都算激活
  if (item.base === '/day' && (route.path.startsWith('/month') || route.path.startsWith('/day') || route.path.startsWith('/year'))) return true
  return route.path === item.path || route.path.startsWith(item.base)
}

/**
 * contextInfo: 结合 current route 计算导航栏左侧的面包屑辅助控件状态
 * 用于指示目前正在查看的具体是哪一年、哪一月，并提供左右翻页及上层返回按钮
 */
const contextInfo = computed(() => {
  const path = route.path
  const { year: currentYear, month, date: currentDate } = getRouteDateContext(route.params, dateStore.currentDate)
  
  if (path.startsWith('/month/')) {
    return {
      title: `${currentYear}年`,
      backPath: buildYearPath(currentYear),
      show: true,
      mode: 'month'
    }
  }
  if (path === '/day' || path.startsWith('/day/')) {
    const prevDate = new Date(currentDate)
    prevDate.setDate(currentDate.getDate() - 1)
    const prevDayPath = buildDayPath(prevDate)
    
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + 1)
    const nextDayPath = buildDayPath(nextDate)

    return {
      title: getMonthName(month, 'en'),
      monthPath: buildMonthPath(currentYear, month),
      prevDayPath,
      nextDayPath,
      show: true,
      mode: 'day'
    }
  }
  return { show: false }
})

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
