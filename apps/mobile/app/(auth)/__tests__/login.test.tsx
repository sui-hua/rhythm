import { fireEvent, render, screen } from '@testing-library/react-native'
import LoginPage from '../login'
import { router } from 'expo-router'
import { setDevMockSession } from '@/features/auth/useAuthSession'

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn()
  }
}))

jest.mock('@/features/auth/useAuthSession', () => ({
  setDevMockSession: jest.fn()
}))

jest.mock('@/services/supabase/auth', () => ({
  signInWithPassword: jest.fn()
}))

describe('LoginPage', () => {
  it('renders form-based login page per design', () => {
    render(<LoginPage />)

    expect(screen.getByText('Rhythm')).toBeTruthy()
    expect(screen.getByText('登录')).toBeTruthy()
    expect(screen.getByText('邮箱')).toBeTruthy()
    expect(screen.getByText('密码')).toBeTruthy()
    expect(screen.getByText('第一次使用建议')).toBeTruthy()
    expect(screen.getByText(/访客体验账号/)).toBeTruthy()
    expect(screen.queryByText(/开发|测试/)).toBeNull()
  })

  it('fills demo credentials when tapping visitor hint', () => {
    render(<LoginPage />)

    fireEvent.press(screen.getByText(/访客体验账号/))

    expect(screen.getByDisplayValue('123456@163.com')).toBeTruthy()
    expect(screen.getByDisplayValue('123456')).toBeTruthy()
  })

  it('enters app via mock session without Supabase', () => {
    render(<LoginPage />)

    fireEvent.press(screen.getByText('不登录，直接体验'))

    expect(setDevMockSession).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/(app)/day')
  })
})
