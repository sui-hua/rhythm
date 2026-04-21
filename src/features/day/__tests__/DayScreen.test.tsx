import { render, screen } from '@testing-library/react-native'
import { DayScreen } from '../screens/DayScreen'

describe('DayScreen', () => {
  it('renders today header and add button shell', () => {
    render(<DayScreen />)

    expect(screen.getByText(/今天/i)).toBeTruthy()
    expect(screen.getByLabelText('新增任务')).toBeTruthy()
  })
})
