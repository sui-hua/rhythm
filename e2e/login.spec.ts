import { test, expect } from '@playwright/test'

/**
 * 登录流程 E2E 测试
 *
 * 覆盖：页面元素、演示账号、登录跳转、加载状态、错误提示、登出
 */

test.describe('登录页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('页面元素完整展示', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#email')).toHaveAttribute('type', 'email')
    await expect(page.locator('#email')).toHaveAttribute('required', '')
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#password')).toHaveAttribute('type', 'password')
    await expect(page.locator('#password')).toHaveAttribute('required', '')

    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toHaveText('登录')
    await expect(page.getByText('使用演示账号体验')).toBeVisible()
  })

  test('点击演示账号 → 自动填充凭据', async ({ page }) => {
    await page.getByText('使用演示账号体验').click()
    await expect(page.locator('#email')).toHaveValue('123456@163.com')
    await expect(page.locator('#password')).toHaveValue('123456')
  })

  test('演示账号登录 → 跳转到首页', async ({ page }) => {
    await page.getByText('使用演示账号体验').click()
    await page.click('button[type="submit"]')
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
    await expect(page).toHaveURL(/\/day/)
  })

  test('登录按钮显示加载状态', async ({ page }) => {
    await page.getByText('使用演示账号体验').click()
    await page.click('button[type="submit"]')
    await expect(page.locator('button[type="submit"]')).toHaveText(/登录中/)
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('错误凭据 → 显示错误提示', async ({ page }) => {
    await page.fill('#email', 'wrong@example.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('.text-red-500')).toBeVisible({ timeout: 10000 })
  })

  test('空表单 → 浏览器原生校验阻止提交', async ({ page }) => {
    await expect(page.locator('#email')).toHaveAttribute('required', '')
    await expect(page.locator('#password')).toHaveAttribute('required', '')
  })
})

test.describe('登录后行为', () => {
  test('已登录访问 /login → 重定向到首页', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('使用演示账号体验').click()
    await page.click('button[type="submit"]')
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })

    await page.goto('/login')
    await expect(page).toHaveURL(/\/day/)
  })

  test('登出后 → 回到登录页', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('使用演示账号体验').click()
    await page.click('button[type="submit"]')
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })

    await page.evaluate(() => localStorage.clear())
    await page.goto('/direction')
    await expect(page).toHaveURL(/\/login/)
  })
})
