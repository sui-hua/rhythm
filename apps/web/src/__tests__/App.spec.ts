import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('App.vue 通知初始化', () => {
  it('应用启动时不初始化通知，也不自动申请权限', () => {
    const appPath = resolve(process.cwd(), 'src/App.vue')
    const source = readFileSync(appPath, 'utf-8')
    const mountedBlock = source.match(/onMounted\(async \(\) => \{([\s\S]*?)\n\}\)/)?.[1] ?? ''

    expect(source).not.toContain("import { useNotifications } from '@/composables/useNotifications'")
    expect(source).not.toMatch(/useNotifications\(\)/)
    expect(mountedBlock).not.toMatch(/useNotifications\(\)/)
    expect(mountedBlock).not.toMatch(/requestPermission\(\)/)
  })
})

describe('App.vue 路由转场', () => {
  it('路由页面使用固定 shell 转场，避免 out-in 切换时卸载为空', () => {
    const appPath = resolve(process.cwd(), 'src/App.vue')
    const source = readFileSync(appPath, 'utf-8')

    expect(source).not.toMatch(/mode=["']out-in["']/)
    expect(source).toMatch(/class="route-view-shell"/)
    expect(source).toMatch(/\.route-view-shell\s*\{/)
  })
})
