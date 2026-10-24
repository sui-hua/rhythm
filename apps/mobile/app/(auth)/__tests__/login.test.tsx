import { render, screen } from '@testing-library/react-native'
import LoginPage from '../login'

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
  it('renders a product-facing login entry without development wording', () => {
    render(<LoginPage />)

    expect(screen.getByText('Rhythm')).toBeTruthy()
    expect(screen.getByText('进入应用')).toBeTruthy()
    expect(screen.getByText('登录账号')).toBeTruthy()
    expect(screen.queryByText(/开发|测试/)).toBeNull()
  })
})
