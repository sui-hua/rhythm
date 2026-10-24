import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// mock authStore
const mockSetUser = vi.fn()
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    setUser: mockSetUser
  })
}))

// mock supabase
const mockSignInWithPassword = vi.fn()
type LoginCredentials = { email: string; password: string }
vi.mock('@/services/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: (credentials: LoginCredentials) => mockSignInWithPassword(credentials)
    }
  }
}))

import { useLoginForm } from '../useLoginForm'

describe('useLoginForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // 默认值：email 和 password 有预填默认值
  it('email 和 password 有默认预填值', () => {
    const { email, password } = useLoginForm()
    expect(email.value).toBe('123456@163.com')
    expect(password.value).toBe('123456')
  })

  // 初始状态：loading 为 false，error 为空
  it('初始状态 loading 为 false，error 为空', () => {
    const { loading, error } = useLoginForm()
    expect(loading.value).toBe(false)
    expect(error.value).toBe('')
  })

  // 成功登录：调用 setUser 并跳转首页
  it('登录成功后调用 setUser 并跳转到 /', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' }
    mockSignInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    const { handleLogin, loading, error } = useLoginForm()
    await handleLogin()

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: '123456@163.com',
      password: '123456'
    })
    expect(mockSetUser).toHaveBeenCalledWith(mockUser)
    expect(mockPush).toHaveBeenCalledWith('/')
    expect(loading.value).toBe(false)
    expect(error.value).toBe('')
  })

  // 登录失败：signInError 时显示错误消息
  it('登录失败时显示错误提示', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' }
    })

    const { handleLogin, error, loading } = useLoginForm()
    await handleLogin()

    expect(error.value).toBe('登录失败，请检查邮箱和密码')
    expect(mockSetUser).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  // 登录异常：catch 块处理未预期错误
  it('未预期异常时显示通用错误消息', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSignInWithPassword.mockRejectedValue(new Error('network error'))

    const { handleLogin, error, loading } = useLoginForm()
    await handleLogin()

    expect(error.value).toBe('发生未预期的错误')
    expect(loading.value).toBe(false)
    consoleSpy.mockRestore()
  })

  // loading 状态：请求期间为 true，结束后为 false
  it('请求期间 loading 为 true，结束后恢复 false', async () => {
    type LoginResult = { data: { user: { id: string } }; error: null }
    let resolveLogin: (value: LoginResult) => void
    mockSignInWithPassword.mockImplementation(
      () => new Promise<LoginResult>((resolve) => { resolveLogin = resolve })
    )

    const { handleLogin, loading } = useLoginForm()
    const loginPromise = handleLogin()

    // 请求发出后 loading 应为 true
    expect(loading.value).toBe(true)

    // 完成请求
    resolveLogin({ data: { user: { id: '1' } }, error: null })
    await loginPromise

    expect(loading.value).toBe(false)
  })

  // loading 状态：异常时也恢复 false
  it('异常时 loading 也恢复为 false', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSignInWithPassword.mockRejectedValue(new Error('fail'))

    const { handleLogin, loading } = useLoginForm()
    await handleLogin()

    expect(loading.value).toBe(false)
    consoleSpy.mockRestore()
  })

  // 每次登录前清空 error
  it('登录前清空之前的错误消息', async () => {
    // 第一次登录失败
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'fail' }
    })
    const { handleLogin, error } = useLoginForm()
    await handleLogin()
    expect(error.value).toBe('登录失败，请检查邮箱和密码')

    // 第二次登录成功
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: '1' } },
      error: null
    })
    await handleLogin()
    expect(error.value).toBe('')
  })

  // data.user 为 null 但无 error 时不调用 setUser
  it('data.user 为 null 且无 error 时不调用 setUser', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: null
    })

    const { handleLogin } = useLoginForm()
    await handleLogin()

    expect(mockSetUser).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
