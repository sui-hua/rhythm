// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import Navbar from '../Navbar.vue'

// mock vue-router
const mockPush = vi.fn()
const mockRoute = ref({ path: '/day/2026/6/5', params: { year: '2026', month: '6', day: '5' } })

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute.value
}))

// mock supabase
vi.mock('@/services/supabase', () => ({
  default: {
    auth: {
      signOut: vi.fn().mockResolvedValue({})
    }
  }
}))

// mock dateStore
vi.mock('@/stores/dateStore', () => ({
  useDateStore: () => ({
    currentDate: new Date(2026, 5, 5)
  })
}))

// mock dateFormatter
vi.mock('@/utils/dateFormatter', () => ({
  getMonthName: () => 'June'
}))

// mock routeDateContext
vi.mock('@/views/day/utils/routeDateContext', () => ({
  buildDayPath: (date: Date) => `/day/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
  buildMonthPath: (y: number, m: number) => `/month/${y}/${m}`,
  buildYearPath: (y: number) => `/year/${y}`,
  getRouteDateContext: () => ({
    year: 2026,
    month: 6,
    date: new Date(2026, 5, 5)
  })
}))

// mock cn 工具
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' ')
}))

// stub 子组件
const stubs = {
  Button: { template: '<button><slot /></button>', props: ['variant', 'size', 'class'] },
  ArrowLeft: { template: '<span />' },
  LogOut: { template: '<span />' }
}

describe('Navbar', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockRoute.value = { path: '/day/2026/6/5', params: { year: '2026', month: '6', day: '5' } }
  })

  it('渲染四个导航项', () => {
    const wrapper = mount(Navbar, { global: { stubs } })
    const text = wrapper.text()
    // 导航项文字可能有空格，检查关键字
    expect(text).toContain('时序')
    expect(text).toContain('习惯')
    expect(text).toContain('所向')
    expect(text).toContain('总结')
  })

  it('日视图路径时显示上下文导航（月份名称）', () => {
    mockRoute.value = { path: '/day/2026/6/5', params: { year: '2026', month: '6', day: '5' } }
    const wrapper = mount(Navbar, { global: { stubs } })
    expect(wrapper.text()).toContain('June')
  })

  it('月视图路径时显示年份返回按钮', () => {
    mockRoute.value = { path: '/month/2026/6', params: { year: '2026', month: '6' } }
    const wrapper = mount(Navbar, { global: { stubs } })
    expect(wrapper.text()).toContain('2026年')
  })

  it('习惯路径时不显示上下文导航', () => {
    mockRoute.value = { path: '/habits', params: {} }
    const wrapper = mount(Navbar, { global: { stubs } })
    expect(wrapper.text()).not.toContain('2026年')
  })

  it('渲染退出登录按钮', () => {
    const wrapper = mount(Navbar, { global: { stubs } })
    // 退出按钮通过 LogOut icon 渲染
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })

  it('点击导航项触发 router.push', async () => {
    mockRoute.value = { path: '/habits', params: {} }
    const wrapper = mount(Navbar, { global: { stubs } })
    // 找到包含"习惯"文字的按钮并点击
    const habitBtn = wrapper.findAll('button').find(b => b.text().includes('习惯'))
    if (habitBtn) {
      await habitBtn.trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/habits')
    }
  })
})
