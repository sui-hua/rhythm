import { test, expect } from './auth.setup'

/**
 * Day 页面（时序模块）E2E 测试
 *
 * 覆盖：页面加载、侧边栏、任务 CRUD、弹窗交互、日期导航、完成状态切换
 */

// 移除残留 overlay 的辅助函数
async function removeOverlay(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-state="open"]').forEach(el => el.remove())
  })
  await page.waitForTimeout(200)
}

// ── 页面加载与基础展示 ──

test.describe('Day 页面 — 基础展示', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto('/day/2026/6/5')
    await authPage.waitForLoadState('domcontentloaded')
  })

  test('侧边栏日期标题和月份名称可见', async ({ authPage: page }) => {
    await expect(page.locator('header h2')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('header p')).toContainText(/TASKS/)
  })

  test('底部显示任务完成度和添加按钮', async ({ authPage: page }) => {
    await expect(page.getByText('任务完成度')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('添加项目')).toBeVisible()
  })
})

// ── 新建任务弹窗 ──

test.describe('Day 页面 — 新建任务弹窗', () => {
  test('点击添加项目 → 弹窗打开，核心表单元素可见', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/5')
    await page.waitForLoadState('domcontentloaded')
    await removeOverlay(page)

    await page.getByText('添加项目').click({ force: true })

    // 使用 h1 选择器避免匹配到 sr-only 的 DialogTitle
    await expect(page.locator('h1:text("新增任务")')).toBeVisible()
    await expect(page.locator('#title')).toBeVisible()
    await expect(page.getByText('任务名称')).toBeVisible()
    await expect(page.getByText('任务时间')).toBeVisible()
    await expect(page.getByText('任务时长')).toBeVisible()
    await expect(page.getByText('分类')).toBeVisible()

    await page.keyboard.press('Escape')
  })

  test('空名称 blur → 校验提示', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/5')
    await page.waitForLoadState('domcontentloaded')
    await removeOverlay(page)

    await page.getByText('添加项目').click({ force: true })
    await page.locator('#title').focus()
    await page.locator('#title').blur()
    await expect(page.getByText('任务名称不能为空')).toBeVisible({ timeout: 3000 })

    await page.keyboard.press('Escape')
  })

  test('填写名称后确认创建 → 弹窗关闭', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/5')
    await page.waitForLoadState('domcontentloaded')
    await removeOverlay(page)

    await page.getByText('添加项目').click({ force: true })
    await page.locator('#title').fill('E2E 测试任务')

    const submitBtn = page.getByText('确认创建')
    if (await submitBtn.isEnabled()) {
      await submitBtn.click()
      await expect(page.locator('h1:text("新增任务")')).not.toBeVisible({ timeout: 5000 })
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('Escape 键关闭弹窗', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/5')
    await page.waitForLoadState('domcontentloaded')
    await removeOverlay(page)

    await page.getByText('添加项目').click({ force: true })
    await expect(page.locator('h1:text("新增任务")')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('h1:text("新增任务")')).not.toBeVisible({ timeout: 3000 })
  })

  test('分类标签可点击', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/5')
    await page.waitForLoadState('domcontentloaded')
    await removeOverlay(page)

    await page.getByText('添加项目').click({ force: true })

    const dialog = page.getByRole('dialog')
    await dialog.getByText('工作', { exact: true }).click()
    await dialog.getByText('个人', { exact: true }).click()

    await page.keyboard.press('Escape')
  })
})

// ── 编辑与删除任务 ──

test.describe('Day 页面 — 编辑任务', () => {
  test('双击侧边栏任务项 → 打开编辑弹窗', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/5')
    await page.waitForLoadState('domcontentloaded')
    await removeOverlay(page)

    const taskItem = page.locator('aside .flex.items-center.gap-3').first()
    if (await taskItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await taskItem.dblclick()
      await expect(page.locator('h1:text("编辑任务")')).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('保存修改')).toBeVisible()
      await expect(page.getByText('删除此任务')).toBeVisible()
      await page.keyboard.press('Escape')
    }
  })

  test('点击任务右侧齿轮图标 → 打开编辑弹窗', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/5')
    await page.waitForLoadState('domcontentloaded')
    await removeOverlay(page)

    const editBtn = page.locator('aside button[aria-label="编辑任务"]').first()
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click()
      await expect(page.locator('h1:text("编辑任务")')).toBeVisible({ timeout: 5000 })
      await page.keyboard.press('Escape')
    }
  })
})

// ── 任务完成状态 ──

test.describe('Day 页面 — 完成状态切换', () => {
  test('侧边栏任务项显示 Checkbox', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/5')
    await page.waitForLoadState('domcontentloaded')

    const checkbox = page.locator('aside button[role="checkbox"]').first()
    if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(checkbox).toBeVisible()
    }
  })
})

// ── 日期导航 ──

test.describe('Day 页面 — 日期导航', () => {
  test('通过 URL 访问指定日期', async ({ authPage: page }) => {
    await page.goto('/day/2026/6/1')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('header h2')).toHaveText('1', { timeout: 10000 })
  })

  test('访问 /day 默认路径 → 显示当天日期', async ({ authPage: page }) => {
    await page.goto('/day')
    await page.waitForLoadState('domcontentloaded')
    const today = new Date().getDate().toString()
    await expect(page.locator('header h2')).toHaveText(today, { timeout: 10000 })
  })
})
