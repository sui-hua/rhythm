import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// 导入页面组件
import LoginView from '@/views/login/index.vue'
import YearView from '@/views/year/index.vue'
import MonthView from '@/views/month/index.vue'
import DayView from '@/views/day/index.vue'
import HabitsView from '@/views/habits/index.vue'
import DirectionView from '@/views/direction/index.vue'
import SummaryView from '@/views/summary/index.vue'

const routes = [
  {
    path: '/login',
    name: 'LoginView',
    component: LoginView
  },
  {
    path: '/',
    redirect: '/day'
  },
  {
    path: '/year',
    name: 'YearView',
    component: YearView
  },
  {
    path: '/month/:monthIndex',
    name: 'MonthView',
    component: MonthView,
    props: true
  },
  {
    path: '/day/:monthIndex/:day',
    name: 'DayView',
    component: DayView,
    props: true
  },
  {
    path: '/day',
    name: 'DayViewToday',
    component: DayView
  },
  {
    path: '/habits',
    name: 'HabitsView',
    component: HabitsView
  },
  {
    path: '/direction',
    name: 'DirectionView',
    component: DirectionView
  },
  {
    path: '/summary',
    name: 'SummaryView',
    component: SummaryView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.path !== '/login' && !authStore.userId) {
    // 如果用户未登录，重定向到登录页面
    next('/login')
  } else if (to.path === '/login' && authStore.userId) {
    // 如果用户已经登录，重定向到首页
    next('/')
  } else {
    next()
  }
})

export default router