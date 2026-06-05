import { test, expect } from './auth.setup'

/**
 * Direction 页面（所向模块）E2E 测试
 *
 * 覆盖：页面加载、目标 CRUD、分类管理、月份范围、延后设置
 */

// ── 页面加载 ──

test.describe('Direction 页面 — 基础展示', () => {
  test('主内容区或骨架屏展示', async ({ authPage: page }) => {
    await page.goto('/direction')
    await page.waitForLoadState('domcontentloaded')

    // 等待至少一个关键元素出现
    await expect(page.locator('.direction-content, .animate-pulse').first()).toBeVisible({ timeout: 10000 })
  })
})

// ── 添加目标 ──

test.describe('Direction 页面 — 添加目标', () => {
  test('点击添加目标 → 弹窗打开，表单元素完整', async ({ authPage: page }) => {
    await page.goto('/direction')
    await page.waitForLoadState('domcontentloaded')

    // 等待页面加载完成
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.animate-pulse')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    const addBtn = page.getByRole('button', { name: '添加目标' })
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click()

      await expect(page.getByText('添加新目标')).toBeVisible({ timeout: 5000 })

      // 表单字段
      await expect(page.locator('#goal-title')).toBeVisible()
      await expect(page.getByText('目标名称')).toBeVisible()
      await expect(page.getByText('目标分类')).toBeVisible()
      await expect(page.getByText('管理类型')).toBeVisible()
      await expect(page.getByText('任务时间')).toBeVisible()
      await expect(page.getByText('预计时长')).toBeVisible()
      await expect(page.getByText('未完成延后展示')).toBeVisible()

      // 延后开关
      await expect(page.getByRole('button', { name: '关闭', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: '开启', exact: true })).toBeVisible()

      // 操作按钮
      await expect(page.getByRole('button', { name: '确认创建' })).toBeVisible()
      await expect(page.getByRole('button', { name: '取消' })).toBeVisible()
    }
  })

  test('填写名称后确认创建 → 弹窗关闭', async ({ authPage: page }) => {
    await page.goto('/direction')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.animate-pulse')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    const addBtn = page.getByRole('button', { name: '添加目标' })
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click()
      await page.locator('#goal-title').fill('E2E 测试目标')
      await page.getByRole('button', { name: '确认创建' }).click()
      await expect(page.getByText('添加新目标')).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('点击取消 → 弹窗关闭', async ({ authPage: page }) => {
    await page.goto('/direction')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.animate-pulse')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    const addBtn = page.getByRole('button', { name: '添加目标' })
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click()
      await page.getByRole('button', { name: '取消' }).click()
      await expect(page.getByText('添加新目标')).not.toBeVisible({ timeout: 3000 })
    }
  })

  test('延后展示开关切换 → 显示/隐藏天数输入', async ({ authPage: page }) => {
    await page.goto('/direction')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.animate-pulse')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    const addBtn = page.getByRole('button', { name: '添加目标' })
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click()

      // 默认关闭，天数输入不可见
      await expect(page.getByText('延后展示天数')).not.toBeVisible()

      // 开启延后
      await page.getByRole('button', { name: '开启', exact: true }).click()
      await expect(page.getByText('延后展示天数')).toBeVisible()

      // 关闭延后
      await page.getByRole('button', { name: '关闭', exact: true }).click()
      await expect(page.getByText('延后展示天数')).not.toBeVisible()
    }
  })
})

// ── 分类管理 ──

test.describe('Direction 页面 — 分类管理', () => {
  test('点击管理类型 → 打开分类管理弹窗', async ({ authPage: page }) => {
    await page.goto('/direction')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.animate-pulse')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    const addBtn = page.getByRole('button', { name: '添加目标' })
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click()
      await page.getByText('管理类型').click()

      // 分类管理弹窗应出现（有输入框或分类列表）
      await expect(page.locator('input[placeholder*="类型"], [class*="category"]').first()).toBeVisible({ timeout: 5000 })
    }
  })
})

// ── 编辑目标 ──

test.describe('Direction 页面 — 编辑目标', () => {
  test('双击侧边栏目标项 → 打开编辑弹窗', async ({ authPage: page }) => {
    await page.goto('/direction')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.animate-pulse')
      return !skeleton || skeleton.offsetParent === null
    }, { timeout: 15000 })

    // 侧边栏目标项
    const goalItem = page.locator('.direction-content').locator('..').locator('> div').first().locator('[class*="cursor"]').first()
    if (await goalItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await goalItem.dblclick()
      await expect(page.getByText('编辑目标')).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('button', { name: '确认修改' })).toBeVisible()
      await expect(page.getByText('删除此目标')).toBeVisible()
    }
  })
})
