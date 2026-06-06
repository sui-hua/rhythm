// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import LoginView from '../index.vue'

// mock useLoginForm composable
const mockEmail = ref('')
const mockPassword = ref('')
const mockLoading = ref(false)
const mockError = ref('')
const mockHandleLogin = vi.fn()

vi.mock('@/views/login/composables/useLoginForm', () => ({
  useLoginForm: () => ({
    email: mockEmail,
    password: mockPassword,
    loading: mockLoading,
    error: mockError,
    handleLogin: mockHandleLogin
  })
}))

// stub WelcomeChecklist 子组件
const stubs = {
  WelcomeChecklist: { template: '<div class="welcome-checklist" />' }
}

describe('LoginView', () => {
  beforeEach(() => {
    mockEmail.value = ''
    mockPassword.value = ''
    mockLoading.value = false
    mockError.value = ''
  })

  it('显示 Email 标签和输入框', () => {
    const wrapper = mount(LoginView, { global: { stubs } })
    expect(wrapper.find('label[for="email"]').text()).toBe('Email')
    expect(wrapper.find('#email').exists()).toBe(true)
  })

  it('显示 Password 标签和输入框', () => {
    const wrapper = mount(LoginView, { global: { stubs } })
    expect(wrapper.find('label[for="password"]').text()).toBe('Password')
    expect(wrapper.find('#password').exists()).toBe(true)
  })

  it('显示登录按钮', () => {
    const wrapper = mount(LoginView, { global: { stubs } })
    expect(wrapper.text()).toContain('登录')
  })

  it('显示"使用演示账号体验"按钮', () => {
    const wrapper = mount(LoginView, { global: { stubs } })
    expect(wrapper.text()).toContain('使用演示账号体验')
  })

  it('加载中时按钮显示"登录中..."', () => {
    mockLoading.value = true
    const wrapper = mount(LoginView, { global: { stubs } })
    expect(wrapper.text()).toContain('登录中...')
  })

  it('加载中时按钮禁用', () => {
    mockLoading.value = true
    const wrapper = mount(LoginView, { global: { stubs } })
    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('显示错误信息', () => {
    mockError.value = '邮箱或密码错误'
    const wrapper = mount(LoginView, { global: { stubs } })
    expect(wrapper.text()).toContain('邮箱或密码错误')
  })

  it('无错误时不显示错误区域', () => {
    mockError.value = ''
    const wrapper = mount(LoginView, { global: { stubs } })
    expect(wrapper.find('.text-red-500').exists()).toBe(false)
  })

  it('点击演示账号按钮填充凭据', async () => {
    // mock window.confirm 以允许演示账号填充
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    // mock handleLogin 避免实际登录请求
    mockHandleLogin.mockResolvedValue(undefined)

    const wrapper = mount(LoginView, { global: { stubs } })
    const demoBtn = wrapper.findAll('button').find(b => b.text().includes('使用演示账号体验'))
    await demoBtn?.trigger('click')
    expect(mockEmail.value).toBe('123456@163.com')
    expect(mockPassword.value).toBe('123456')
    expect(mockHandleLogin).toHaveBeenCalled()
  })

  it('渲染 WelcomeChecklist 组件', () => {
    const wrapper = mount(LoginView, { global: { stubs } })
    expect(wrapper.find('.welcome-checklist').exists()).toBe(true)
  })
})
