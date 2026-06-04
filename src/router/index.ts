/**
 * 路由配置与守卫
 *
 * 定义应用的路由表和全局导航守卫。
 * 路由守卫基于 authStore.userId 判断登录状态，未登录用户重定向到 /login。
 * 路由切换期间自动管理全局加载进度条。
 */

// ── 依赖导入 ──
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { beginRouteLoading, endRouteLoading } from '@/composables/useGlobalLoading'
import { buildDayPath, buildMonthPath, buildYearPath } from '@/views/day/utils/routeDateContext'

// ── 路由组件懒加载 ──
const LoginView = () => import('@/views/login/index.vue')
const YearView = () => import('@/views/year/index.vue')
const MonthView = () => import('@/views/month/index.vue')
const DayView = () => import('@/views/day/index.vue')
const HabitsView = () => import('@/views/habits/index.vue')
const DirectionView = () => import('@/views/direction/index.vue')
const SummaryView = () => import('@/views/summary/index.vue')

// ── 路由配置表 ──
// 无参数路径（/day、/month、/year）自动重定向到当天/当月/当年
const routes: RouteRecordRaw[] = [
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

// ── 全局前置守卫 ──
// 未登录用户访问非登录页时重定向到 /login
// 已登录用户访问 /login 时重定向到首页
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.path !== '/login' && !authStore.userId) {
    next('/login')
  } else if (to.path === '/login' && authStore.userId) {
    next('/')
  } else {
    beginRouteLoading()
    next()
  }
})

// ── 全局后置守卫 ──
// 路由切换完成或出错时结束加载进度条
router.afterEach(() => {
  endRouteLoading()
})

router.onError(() => {
  endRouteLoading()
})

export default router
