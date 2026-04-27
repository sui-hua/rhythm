/**
 * ============================================
 * 路由配置 (router/index.js)
 * ============================================
 *
 * 【模块职责】
 * - 定义应用所有路由规则
 * - 页面组件按需加载（路由懒加载）
 * - 路由守卫：登录状态校验
 *
 * 【路由结构】
 * - /login         → 登录页
 * - /day/:y/:m/:d  → 日视图（时间轴）
 * - /month/:y/:m   → 月视图
 * - /year/:y       → 年视图
 * - /habits        → 习惯追踪
 * - /direction     → 目标管理（plans → monthly_plans → daily_plans 三级）
 * - /summary       → 日/周/月/年总结
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { buildDayPath, buildMonthPath, buildYearPath } from '@/views/day/utils/routeDateContext'

// 页面组件按需加载 - 仅在访问对应路由时才加载（路由懒加载）
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
    redirect: () => buildDayPath(new Date())
  },
  {
    path: '/year',
    redirect: () => buildYearPath(new Date().getFullYear())
  },
  {
    path: '/year/:year',
    name: 'YearView',
    component: YearView,
    props: true
  },
  {
    path: '/month',
    redirect: () => {
      const now = new Date()
      return buildMonthPath(now.getFullYear(), now.getMonth() + 1)
    }
  },
  {
    path: '/month/:year/:month',
    name: 'MonthView',
    component: MonthView,
    props: true
  },
  {
    path: '/day',
    name: 'DayViewDefault',
    component: DayView
  },
  {
    path: '/day/:year/:month/:day',
    name: 'DayView',
    component: DayView,
    props: true
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
