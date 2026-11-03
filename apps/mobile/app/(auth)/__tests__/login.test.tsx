import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import LoginPage from '../login'
import { router } from 'expo-router'
import { signInLocal } from '@/features/auth/useAuthSession'

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn()
  }
}))

jest.mock('@/features/auth/useAuthSession', () => ({
  signInLocal: jest.fn()
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('只渲染品牌标识与登录表单', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText('Rhythm 标志')).toBeTruthy()
    expect(screen.getByText('Rhythm')).toBeTruthy()
    expect(screen.getByText('邮箱')).toBeTruthy()
    expect(screen.getByText('密码')).toBeTruthy()
    expect(screen.getByText('登录')).toBeTruthy()
  })

  it('不再渲染标语、引导卡片与演示账号入口', () => {
    render(<LoginPage />)

    expect(screen.queryByText('记录节奏 · 看见成长')).toBeNull()
    expect(screen.queryByText('第一次使用建议')).toBeNull()
    expect(screen.queryByText(/访客体验账号/)).toBeNull()
    expect(screen.queryByText('不登录，直接体验')).toBeNull()
  })

  it('提交后建立本地会话并进入 Day', async () => {
    render(<LoginPage />)

    fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), 'demo@163.com')
    fireEvent.changeText(screen.getByPlaceholderText('请输入密码'), '123456')
    fireEvent.press(screen.getByText('登录'))

    await waitFor(() => expect(signInLocal).toHaveBeenCalledWith('demo@163.com'))
    expect(router.replace).toHaveBeenCalledWith('/(app)/day')
  })
})
