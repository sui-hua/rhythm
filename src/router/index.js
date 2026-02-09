import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import YearView from '@/views/year/index.vue'
import MonthView from '@/views/month/index.vue'
import DayView from '@/views/day/index.vue'
import HabitsView from '@/views/habits/index.vue'
import DirectionView from '@/views/direction/index.vue'
import SummaryView from '@/views/summary/index.vue'

const routes = [
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
    redirect: () => {
      const now = new Date()
      return `/day/${now.getMonth()}/${now.getDate()}`
    }
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

export default router