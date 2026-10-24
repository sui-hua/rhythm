import { test, expect } from '@playwright/test'

/**
 * 路由守卫 E2E 测试
 *
 * 覆盖：未登录重定向、登录页基础校验
 */

test.describe('路由守卫 — 未登录重定向', () => {
  const protectedRoutes = [
    { path: '/', desc: '首页' },
    { path: '/direction', desc: '所向模块' },
    { path: '/habits', desc: '习惯模块' },
    { path: '/summary', desc: '总结模块' },
    { path: '/day/2026/6/5', desc: '指定日期' },
    { path: '/month/2026/6', desc: '指定月份' },
    { path: '/year/2026', desc: '指定年份' },
  ]

  for (const route of protectedRoutes) {
    test(`未登录访问 ${route.desc}（${route.path}）→ 重定向到 /login`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

test.describe('登录页基础校验', () => {
  test('表单元素完整', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.getByText('使用演示账号体验')).toBeVisible()
  })
})
