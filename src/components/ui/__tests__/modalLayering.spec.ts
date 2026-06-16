import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = process.cwd()

// 读取组件源码，用于约束弹框相关的 Tailwind 层级类名。
function readComponent(path: string) {
  return readFileSync(resolve(projectRoot, path), 'utf-8')
}

describe('modal layering', () => {
  it('对话框遮罩和内容层级高于全局导航', () => {
    const source = readComponent('src/components/ui/dialog/DialogContent.vue')

    expect(source).toContain('fixed inset-0 z-[300]')
    expect(source).toContain('fixed left-1/2 top-1/2 z-[310]')
  })

  it('时间选择弹层使用 Reka 触发器宽度并高于对话框内容', () => {
    const source = readComponent('src/components/ui/TimePicker.vue')

    expect(source).toContain('w-[var(--reka-popover-trigger-width)]')
    expect(source).toContain('z-[320]')
  })

  it('下拉选择弹层高于对话框内容', () => {
    const source = readComponent('src/components/ui/select/SelectContent.vue')

    expect(source).toContain('relative z-[320]')
  })
})
