import { fireEvent, render, screen } from '@testing-library/react-native'
import { PortalHost } from '@rn-primitives/portal'
import { DayScreen } from '../screens/DayScreen'

// DayScreen 已切换到内存假数据（src/mocks），断言基于种子数据
function renderDayScreen() {
  return render(
    <>
      <DayScreen />
      <PortalHost />
    </>
  )
}

describe('DayScreen', () => {
  it('renders date header, scheduled item and add task button', () => {
    renderDayScreen()

    // 日期栏按设计稿展示「M月D日 周X」，正则匹配避免依赖运行日期
    expect(screen.getByText(/月\d+日 周/)).toBeTruthy()
    expect(screen.getByText('晨间阅读')).toBeTruthy()
    expect(screen.getByLabelText('新增任务')).toBeTruthy()
  })

  it('opens task editor from add button', () => {
    renderDayScreen()

    fireEvent.press(screen.getByLabelText('新增任务'))

    expect(screen.getByText('新建任务')).toBeTruthy()
  })

  it('toggles an execution item from the card check control', () => {
    renderDayScreen()

    // 项目复盘会在种子里为未完成态
    fireEvent.press(screen.getByLabelText('完成项目复盘会'))

    // 假数据切换后变为已完成态，勾选标签反转为「取消完成」
    expect(screen.getByLabelText('取消完成项目复盘会')).toBeTruthy()
  })
})
