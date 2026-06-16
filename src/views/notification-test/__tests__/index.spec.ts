import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const routerSource = readFileSync(resolve(process.cwd(), 'src/router/index.ts'), 'utf-8')
const pagePath = resolve(process.cwd(), 'src/views/notification-test/index.vue')

describe('notification diagnostics route', () => {
  it('registers a public notification test route', () => {
    expect(routerSource).toContain("const NotificationTestView = () => import('@/views/notification-test/index.vue')")
    expect(routerSource).toContain("path: '/notification-test'")
    expect(routerSource).toContain('publicPaths.includes(to.path)')
  })

  it('provides a manual diagnostics page for foreground and service worker notifications', () => {
    expect(existsSync(pagePath)).toBe(true)

    const pageSource = readFileSync(pagePath, 'utf-8')
    expect(pageSource).toContain('sendForegroundNotification')
    expect(pageSource).toContain('sendServiceWorkerNotification')
    expect(pageSource).toContain('/notification-icon.png')
  })
})
