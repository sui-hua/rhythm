<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    <Navbar />
    <Transition :name="transitionName" mode="out-in">
      <RouterView />
    </Transition>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import supabase from './config/supabase'

const route = useRoute()

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
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(event)   // SIGNED_IN / SIGNED_OUT
    console.log(session)
  })
  // const {data, error} = await supabase.auth.signInWithPassword({
  //   email: 'sizhanfeng1012@163.com',
  //   password: 'szf1012wzs'
  // })
  const res = await supabase.auth.getUser()

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
