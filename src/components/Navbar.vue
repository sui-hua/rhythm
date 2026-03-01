<template>
  <!-- 
    导航栏最外层父容器
    - group: 定义一个 hover 组，当鼠标悬停在其内部有效区域时，触发整个组的 group-hover 状态
    - pointer-events-none: 作为全宽块级元素，使其不会阻挡页面下方原有内容的点击事件
  -->
  <div class="fixed top-0 left-0 right-0 h-24 z-[200] group pointer-events-none">
    <!-- 
      实际的导航面板
      - 默认状态:  -translate-y-[150%] (隐藏在顶部之外) 且 opacity-0 (透明)
      - 悬停状态 (group-hover): translate-y-0 opacity-100 (往下滑出并显示)
      - pointer-events-auto: 恢复本身的鼠标交互，使得内部按钮可以点击，且鼠标悬停在它身上时面板不会消失
    -->
    <!-- <nav class="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-white/80 backdrop-blur-xl border border-zinc-100 rounded-full pl-2 pr-2 py-2 shadow-2xl shadow-black/5 transition-all duration-500 ease-in-out -translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 pointer-events-auto"> -->
    <nav class="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-white/80 backdrop-blur-xl border border-zinc-100 rounded-full pl-2 pr-2 py-2 shadow-2xl shadow-black/5 transition-all duration-500 ease-in-out translate-y-0opacity-100 pointer-events-auto">
      <div class="flex items-center gap-1">
        <!-- Back Button & Context Title -->
        <!-- Back Button & Context Title -->
        <template v-if="contextInfo.show">
          <div class="flex items-center gap-2 px-4 pr-6 border-r border-zinc-100 mr-2">
            <!-- Year View Mode: Back to Year -->
            <template v-if="contextInfo.mode === 'month'">
               <Button
                variant="ghost"
                size="icon"
                @click="router.push(contextInfo.backPath)"
                class="w-8 h-8 rounded-full hover:bg-black hover:text-white transition-all"
              >
                <ArrowLeft class="w-4 h-4" />
              </Button>
              <span class="text-[12px] font-black uppercase tracking-widest italic whitespace-nowrap">
                {{ contextInfo.title }}
              </span>
            </template>

            <!-- Day View Mode: Prev/Next Day & Clickable Month -->
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
        </template>

        <Button
          v-for="item in navItems"
          :key="item.path"
          variant="ghost"
          size="sm"
          @click="router.push(item.path)"
          :class="cn(
            'rounded-full px-6 h-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500',
            isActive(item) 
              ? 'bg-black text-white hover:bg-black hover:text-white shadow-lg' 
              : 'text-zinc-400 hover:text-black hover:bg-zinc-50'
          )"
        >
          <component :is="item.icon" class="w-3.5 h-3.5 mr-2" />
          {{ item.name }}
        </Button>

        <div class="w-px h-4 bg-zinc-200 mx-1"></div>

        <Button
          variant="ghost"
          size="sm"
          @click="handleLogout"
          class="rounded-full px-4 h-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 text-zinc-400 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut class="w-3.5 h-3.5 mr-2" />
          登出
        </Button>
      </div>
    </nav>
    <!-- 
      顶部隐形触发热区 (Invisible Trigger Area)
      - 固定在最顶部的透明高 10px(h-10) 区域
      - pointer-events-auto: 恢复鼠标事件捕捉。当鼠标触碰到这个区域时，就会触发外层 div 的 group:hover 动作，从而使 nav 导航栏滑出
    -->
    <div class="absolute top-0 left-0 right-0 h-10 pointer-events-auto"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2, Compass, LayoutGrid, ArrowLeft, BookOpen, LogOut } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import supabase from '@/config/supabase'

const router = useRouter()
const route = useRoute()

const getTodayPath = () => {
  const now = new Date() // As per user metadata context
  return `/day/${now.getMonth() + 1}/${now.getDate()}`
}

const navItems = [
  { name: '时序 ', path: getTodayPath(), icon: LayoutGrid, base: '/year' },
  { name: '习惯', path: '/habits', icon: CheckCircle2, base: '/habits' },
  { name: '所向 ', path: '/direction', icon: Compass, base: '/direction' },
  { name: '总结', path: '/summary', icon: BookOpen, base: '/summary' },
]

const isActive = (item) => {
  if (item.base === '/year' && (route.path.startsWith('/month') || route.path.startsWith('/day') || route.path === '/year')) return true
  return route.path === item.path
}

const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

const contextInfo = computed(() => {
  const path = route.path
  if (path.startsWith('/month/')) {
    return {
      title: '2026',
      backPath: '/year',
      show: true,
      mode: 'month'
    }
  }
  if (path.startsWith('/day/')) {
    const monthIndex = parseInt(route.params.monthIndex) - 1 // Fix 1-based index
    const day = parseInt(route.params.day)
    
    // Calculate Prev/Next Day
    const currentYear = 2026
    const currentDate = new Date(currentYear, monthIndex, day)
    
    const prevDate = new Date(currentDate)
    prevDate.setDate(day - 1)
    const prevDayPath = `/day/${prevDate.getMonth() + 1}/${prevDate.getDate()}`
    
    const nextDate = new Date(currentDate)
    nextDate.setDate(day + 1)
    const nextDayPath = `/day/${nextDate.getMonth() + 1}/${nextDate.getDate()}`

    return {
      title: months[monthIndex],
      monthPath: `/month/${monthIndex + 1}`,
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
