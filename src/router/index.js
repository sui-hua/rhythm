import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// 页面组件按需加载 - 仅在访问对应路由时才加载
const LoginView = () => import('@/views/login/index.vue')
const YearView = () => import('@/views/year/index.vue')
const MonthView = () => import('@/views/month/index.vue')
const DayView = () => import('@/views/day/index.vue')
const HabitsView = () => import('@/views/habits/index.vue')
const DirectionView = () => import('@/views/direction/index.vue')
const SummaryView = () => import('@/views/summary/index.vue')

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