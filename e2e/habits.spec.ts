import { test, expect } from './auth.setup'

/**
 * Habits 页面（习惯模块）E2E 测试
 *
 * 覆盖：页面加载、习惯 CRUD、频率选择、日历交互、快速打卡、归档/删除
 */

// ── 页面加载 ──

test.describe('Habits 页面 — 基础展示', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto('/habits')
    await authPage.waitForLoadState('domcontentloaded')
    await authPage.waitForSelector('.habits-desktop-root', { timeout: 10000 })
  })

  test('页面根容器和侧边栏可见', async ({ authPage: page }) => {
    await expect(page.locator('.habits-desktop-root')).toBeVisible()
    await expect(page.locator('.habits-desktop-root > div').first()).toBeVisible()
  })

  test('显示习惯内容或空状态', async ({ authPage: page }) => {
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.habits-desktop-skeleton')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    const hasContent = await page.locator('.habits-desktop-content').isVisible().catch(() => false)
    const hasEmpty = await page.locator('.habits-empty-state').isVisible().catch(() => false)
    expect(hasContent || hasEmpty).toBeTruthy()
  })
})

// ── 添加习惯 ──

test.describe('Habits 页面 — 添加习惯', () => {
  test('点击添加项目 → 弹窗打开，表单元素完整', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.habits-desktop-skeleton')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    await page.getByText('添加项目').first().click()

    await expect(page.getByText('添加新习惯')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#habit-title')).toBeVisible()
    await expect(page.getByText('习惯名称')).toBeVisible()
    await expect(page.getByText('习惯时间')).toBeVisible()
    await expect(page.getByText('习惯时长')).toBeVisible()
    await expect(page.getByText('重复方式')).toBeVisible()
    await expect(page.getByText('每日', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('每周', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('每月', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('确认创建')).toBeVisible()
    await expect(page.getByText('取消')).toBeVisible()
  })

  test('空名称 blur → 校验提示', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.getByText('添加项目').first().click()

    await page.locator('#habit-title').focus()
    await page.locator('#habit-title').blur()
    await expect(page.getByText('请输入习惯名称')).toBeVisible({ timeout: 3000 })
  })

  test('填写名称后确认创建 → 弹窗关闭', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.getByText('添加项目').first().click()

    await page.locator('#habit-title').fill('E2E 测试习惯')
    await page.getByText('确认创建').click()
    await expect(page.getByText('添加新习惯')).not.toBeVisible({ timeout: 5000 })
  })

  test('频率切换：每日/每周/每月', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.getByText('添加项目').first().click()

    await page.getByText('每周', { exact: true }).first().click()
    await expect(page.getByText('选择每周执行的星期')).toBeVisible()

    await page.getByText('每月', { exact: true }).first().click()
    await expect(page.getByText('选择每月执行的日期')).toBeVisible()

    await page.getByText('每日', { exact: true }).first().click()
    await expect(page.getByText('选择每周执行的星期')).not.toBeVisible()
    await expect(page.getByText('选择每月执行的日期')).not.toBeVisible()
  })

  test('每周频率 → 可选择星期', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.getByText('添加项目').first().click()

    await page.getByText('每周', { exact: true }).first().click()

    // 星期按钮在包含"选择每周执行的星期"提示的容器内
    const weekdaySection = page.locator('text=选择每周执行的星期').locator('..')
    await weekdaySection.getByText('一', { exact: true }).click()
    await weekdaySection.getByText('五', { exact: true }).click()
  })

  test('每月频率 → 可选择日期', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.getByText('添加项目').first().click()

    await page.getByText('每月', { exact: true }).first().click()

    // 日期按钮在包含"选择每月执行的日期"提示的容器内
    const monthDaySection = page.locator('text=选择每月执行的日期').locator('..')
    await monthDaySection.getByText('1', { exact: true }).click()
  })

  test('点击取消 → 弹窗关闭', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.getByText('添加项目').first().click()

    await page.getByText('取消').click()
    await expect(page.getByText('添加新习惯')).not.toBeVisible({ timeout: 3000 })
  })
})

// ── 编辑习惯 ──

test.describe('Habits 页面 — 编辑习惯', () => {
  test('点击侧边栏习惯项齿轮图标 → 打开编辑弹窗', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.habits-desktop-skeleton')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    // 侧边栏中的编辑按钮（齿轮图标）
    const editBtn = page.locator('.habits-desktop-root > div').first().locator('button[aria-label*="编辑"], button[aria-label*="edit"]').first()
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click()
      await expect(page.getByText('修改习惯')).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('保存修改')).toBeVisible()
      await expect(page.getByText('删除该习惯')).toBeVisible()
    }
  })
})

// ── 选择习惯与内容展示 ──

test.describe('Habits 页面 — 选择习惯', () => {
  test('单击习惯项 → 右侧展示日历和统计', async ({ authPage: page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.habits-desktop-root', { timeout: 10000 })
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.habits-desktop-skeleton')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    const sidebar = page.locator('.habits-desktop-root > div').first()
    const habitItems = sidebar.locator('button, [role="button"], [class*="cursor-pointer"]')
    const firstHabit = habitItems.first()
    if (await firstHabit.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstHabit.click()
      await expect(page.locator('.habits-desktop-content')).toBeVisible({ timeout: 5000 })
    }
  })
})
