// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useResizable } from '../useResizable'

// mock vue 的 onUnmounted，避免 "onUnmounted is called when there is no active component instance" 错误
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    onUnmounted: vi.fn()
  }
})

const STORAGE_KEY = 'sidebar-width'

describe('useResizable', () => {
  beforeEach(() => {
    // 每个测试前清除 localStorage
    localStorage.clear()
  })

  // 默认宽度使用 initialWidth 参数
  it('无 localStorage 时使用 initialWidth 默认值 420', () => {
    const { width } = useResizable()
    expect(width.value).toBe(420)
  })

  // 自定义 initialWidth 生效
  it('自定义 initialWidth 参数生效', () => {
    const { width } = useResizable(500)
    expect(width.value).toBe(500)
  })

  // localStorage 有存储值时优先使用
  it('localStorage 有值时优先使用存储的宽度', () => {
    localStorage.setItem(STORAGE_KEY, '350')
    const { width } = useResizable(420)
    expect(width.value).toBe(350)
  })

  // isResizing 初始为 false
  it('isResizing 初始状态为 false', () => {
    const { isResizing } = useResizable()
    expect(isResizing.value).toBe(false)
  })

  // startResize 后 isResizing 变为 true
  it('调用 startResize 后 isResizing 变为 true', () => {
    const { isResizing, startResize } = useResizable()

    startResize(new MouseEvent('mousedown'))
    expect(isResizing.value).toBe(true)
  })

  // mouseup 后 isResizing 恢复为 false
  it('mouseup 后 isResizing 恢复为 false', () => {
    const { isResizing, startResize } = useResizable()

    startResize(new MouseEvent('mousedown'))
    expect(isResizing.value).toBe(true)

    // 触发 mouseup
    document.dispatchEvent(new MouseEvent('mouseup'))
    expect(isResizing.value).toBe(false)
  })

  // clamp min 逻辑：拖拽到小于 minWidth 时限制为 minWidth
  it('拖拽宽度小于 minWidth 时限制为 minWidth（默认 300）', () => {
    const { width, startResize } = useResizable(420, 300, 600)

    startResize(new MouseEvent('mousedown'))

    // 模拟鼠标移动到 x=100（小于 minWidth=300）
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }))
    expect(width.value).toBe(300)
  })

  // clamp max 逻辑：拖拽到大于 maxWidth 时限制为 maxWidth
  it('拖拽宽度大于 maxWidth 时限制为 maxWidth（默认 600）', () => {
    const { width, startResize } = useResizable(420, 300, 600)

    startResize(new MouseEvent('mousedown'))

    // 模拟鼠标移动到 x=800（大于 maxWidth=600）
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 800 }))
    expect(width.value).toBe(600)
  })

  // 自定义 min/max 生效
  it('自定义 minWidth 和 maxWidth 参数生效', () => {
    const { width, startResize } = useResizable(400, 200, 500)

    startResize(new MouseEvent('mousedown'))

    // 在范围内
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 350 }))
    expect(width.value).toBe(350)

    // 超出最大
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 500 }))
    expect(width.value).toBe(500)

    // 低于最小
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }))
    expect(width.value).toBe(200)
  })

  // mouseup 后宽度写入 localStorage
  it('mouseup 后将当前宽度写入 localStorage', () => {
    const { startResize } = useResizable(420, 300, 600)

    startResize(new MouseEvent('mousedown'))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450 }))
    document.dispatchEvent(new MouseEvent('mouseup'))

    expect(localStorage.getItem(STORAGE_KEY)).toBe('450')
  })

  // 未拖拽时 mousemove 不更新宽度
  it('未调用 startResize 时 mousemove 不影响宽度', () => {
    const { width } = useResizable(420, 300, 600)

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 500 }))
    // 宽度不变
    expect(width.value).toBe(420)
  })
})
