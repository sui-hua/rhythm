<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2, Compass, LayoutGrid, ArrowLeft, BookOpen } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const router = useRouter()
const route = useRoute()

const getTodayPath = () => {
  const now = new Date() // As per user metadata context
  return `/day/${now.getMonth()}/${now.getDate()}`
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
      show: true
    }
  }
  if (path.startsWith('/day/')) {
    const monthIndex = parseInt(route.params.monthIndex)
    return {
      title: months[monthIndex],
      backPath: `/month/${monthIndex}`,
      show: true
    }
  }
  return { show: false }
})
</script>

<template>
  <div class="fixed top-0 left-0 right-0 h-24 z-[200] group pointer-events-none">
    <nav class="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-white/80 backdrop-blur-xl border border-zinc-100 rounded-full pl-2 pr-2 py-2 shadow-2xl shadow-black/5 transition-all duration-500 ease-in-out -translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 pointer-events-auto">
      <div class="flex items-center gap-1">
        <!-- Back Button & Context Title -->
        <template v-if="contextInfo.show">
          <div class="flex items-center gap-4 px-4 pr-6 border-r border-zinc-100 mr-2">
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
      </div>
    </nav>
    <!-- Invisible trigger area that remains at the top -->
    <div class="absolute top-0 left-0 right-0 h-10 pointer-events-auto"></div>
  </div>
</template>
