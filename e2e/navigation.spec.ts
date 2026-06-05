import { test, expect } from './auth.setup'

/**
 * 全局导航与路由 E2E 测试
 *
 * 覆盖：页面间导航、月/年度视图、默认路径重定向
 */

// ── 页面间导航 ──

test.describe('页面间导航', () => {
  test('Day → Habits → Direction → Summary → Day', async ({ authPage: page }) => {
    // Day
    await page.goto('/day')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/day/)

    // Habits
    await page.goto('/habits')
    await expect(page).toHaveURL(/\/habits/)
    await expect(page.locator('.habits-desktop-root')).toBeVisible({ timeout: 10000 })

    // Direction
    await page.goto('/direction')
    await expect(page).toHaveURL(/\/direction/)

    // Summary
    await page.goto('/summary')
    await expect(page).toHaveURL(/\/summary/)
    await expect(page.getByText('总结回顾')).toBeVisible({ timeout: 10000 })

    // 回到 Day
    await page.goto('/day')
    await expect(page).toHaveURL(/\/day/)
  })
})

// ── 月度和年度视图 ──

test.describe('月度和年度视图', () => {
  test('月度视图正常加载', async ({ authPage: page }) => {
    await page.goto('/month/2026/6')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()
  })

  test('年度视图正常加载', async ({ authPage: page }) => {
    await page.goto('/year/2026')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()
  })

  test('/month → 重定向到当月', async ({ authPage: page }) => {
    await page.goto('/month')
    await expect(page).toHaveURL(/\/month\/\d{4}\/\d{1,2}/, { timeout: 10000 })
  })

  test('/year → 重定向到当年', async ({ authPage: page }) => {
    await page.goto('/year')
    await expect(page).toHaveURL(/\/year\/\d{4}/, { timeout: 10000 })
  })

  test('/ → 重定向到 /day', async ({ authPage: page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/day/, { timeout: 10000 })
  })
})
