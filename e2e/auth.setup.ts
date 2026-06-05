import { test as base, type Page } from '@playwright/test'

/**
 * 认证辅助函数
 *
 * 通过演示账号登录，返回已认证的 page 对象。
 * 用于需要登录态的测试用例。
 */
export async function loginAsDemo(page: Page): Promise<void> {
  await page.goto('/login')
  await page.fill('#email', '123456@163.com')
  await page.fill('#password', '123456')
  await page.click('button[type="submit"]')
  // 等待登录完成，URL 不再是 /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 60000 })
}

/**
 * 扩展测试 fixture，注入已认证的 page
 *
 * 使用方式：
 * import { test, expect } from './auth.setup'
 * test('需要登录的用例', async ({ authPage }) => { ... })
 */
export const test = base.extend<{ authPage: Page }>({
  authPage: async ({ page }, use) => {
    await loginAsDemo(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
