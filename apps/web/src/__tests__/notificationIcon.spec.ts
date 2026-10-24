import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const notificationIconPath = resolve(process.cwd(), 'public/notification-icon.png')

// 读取 PNG 头部尺寸，用于确认通知图标不是过小的 favicon 资源
function readPngSize(filePath: string): { width: number; height: number } {
  const buffer = readFileSync(filePath)
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  expect(isPng).toBe(true)

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  }
}

describe('notification icon asset', () => {
  it('provides a PNG icon large enough for system notifications', () => {
    expect(existsSync(notificationIconPath)).toBe(true)

    const size = readPngSize(notificationIconPath)
    expect(size.width).toBeGreaterThanOrEqual(96)
    expect(size.height).toBeGreaterThanOrEqual(96)
  })

  it('uses the PNG notification icon in the service worker', () => {
    const swSource = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf-8')

    expect(swSource).toContain("const NOTIFICATION_ICON_URL = '/notification-icon.png'")
    expect(swSource).toContain('icon: NOTIFICATION_ICON_URL')
    expect(swSource).toContain('badge: NOTIFICATION_ICON_URL')
    expect(swSource).not.toContain("icon: '/favicon.ico'")
  })
})
