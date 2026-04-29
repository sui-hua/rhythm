import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('App.vue 通知初始化', () => {
  it('在 setup 顶层创建通知 composable，而不是在 mounted 回调里创建', () => {
    const appPath = resolve(process.cwd(), 'src/App.vue')
    const source = readFileSync(appPath, 'utf-8')
    const mountedBlock = source.match(/onMounted\(async \(\) => \{([\s\S]*?)\n\}\)/)?.[1] ?? ''

    expect(source).toMatch(/const\s+\{\s*requestPermission\s*\}\s*=\s*useNotifications\(\)/)
    expect(mountedBlock).not.toMatch(/useNotifications\(\)/)
  })
})
