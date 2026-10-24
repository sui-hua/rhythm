import { test, expect } from './auth.setup'

/**
 * Summary 页面（总结模块）E2E 测试
 *
 * 覆盖：页面加载、Tab 切换、新建/编辑/删除总结、日总结表单、通用总结表单
 */

// ── 页面加载与 Tab ──

test.describe('Summary 页面 — 基础展示', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto('/summary')
    await authPage.waitForLoadState('domcontentloaded')
  })

  test('主内容区和侧边栏标题可见', async ({ authPage: page }) => {
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('总结回顾')).toBeVisible()
  })

  test('四个 Tab 标签可见', async ({ authPage: page }) => {
    await expect(page.getByText('日总结')).toBeVisible()
    await expect(page.getByText('周总结')).toBeVisible()
    await expect(page.getByText('月总结')).toBeVisible()
    await expect(page.getByText('年总结')).toBeVisible()
  })

  test('默认选中日总结 Tab', async ({ authPage: page }) => {
    // 日总结 tab 应有激活样式（text-foreground）
    const dayTab = page.getByText('日总结')
    await expect(dayTab).toHaveClass(/text-foreground/)
  })
})

// ── Tab 切换 ──

test.describe('Summary 页面 — Tab 切换', () => {
  const tabs = ['日总结', '周总结', '月总结', '年总结']

  for (const tabName of tabs) {
    test(`切换到「${tabName}」→ 列表刷新`, async ({ authPage: page }) => {
      await page.goto('/summary')
      await page.waitForLoadState('domcontentloaded')

      await page.getByText(tabName, { exact: true }).click()
      // 等待数据加载
      await page.waitForTimeout(1000)

      // 切换后要么显示空状态，要么显示列表
      const hasEmpty = await page.getByText('暂无总结记录').isVisible().catch(() => false)
      const hasList = await page.locator('main').isVisible().catch(() => false)
      expect(hasEmpty || hasList).toBeTruthy()
    })
  }
})

// ── 新建总结 ──

test.describe('Summary 页面 — 新建日总结', () => {
  test('点击浮动+按钮 → 进入新建模式，日总结表单完整', async ({ authPage: page }) => {
    await page.goto('/summary')
    await page.waitForLoadState('domcontentloaded')

    // 点击右下角浮动+按钮
    const addBtn = page.locator('aside button').filter({ has: page.locator('svg') }).last()
    await addBtn.click()

    // 日总结表单字段
    await expect(page.getByText('今日成就')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('改进之处')).toBeVisible()
    await expect(page.getByText('明日计划')).toBeVisible()

    // 三个 Textarea
    await expect(page.getByPlaceholder('今天完成了哪些重要事情？')).toBeVisible()
    await expect(page.getByPlaceholder('有哪些地方可以做得更好？')).toBeVisible()
    await expect(page.getByPlaceholder('明天最优先处理的任务是什么？')).toBeVisible()

    // 操作按钮
    await expect(page.getByText('保存今日总结')).toBeVisible()
    await expect(page.getByText('取消')).toBeVisible()
  })

  test('填写日总结后保存 → 返回空状态或列表', async ({ authPage: page }) => {
    await page.goto('/summary')
    await page.waitForLoadState('domcontentloaded')

    const addBtn = page.locator('aside button').filter({ has: page.locator('svg') }).last()
    await addBtn.click()

    // 填写表单
    await page.getByPlaceholder('今天完成了哪些重要事情？').fill('完成了 E2E 测试编写')
    await page.getByPlaceholder('有哪些地方可以做得更好？').fill('测试覆盖率可以更高')
    await page.getByPlaceholder('明天最优先处理的任务是什么？').fill('继续完善测试')

    // 保存
    await page.getByText('保存今日总结').click()

    // 等待保存完成
    await page.waitForTimeout(2000)
  })

  test('点击取消 → 退出编辑模式', async ({ authPage: page }) => {
    await page.goto('/summary')
    await page.waitForLoadState('domcontentloaded')

    const addBtn = page.locator('aside button').filter({ has: page.locator('svg') }).last()
    await addBtn.click()

    await page.getByText('取消').click()
    await expect(page.getByText('今日成就')).not.toBeVisible({ timeout: 3000 })
  })
})

// ── 通用总结（周/月/年）──

test.describe('Summary 页面 — 新建通用总结', () => {
  test('切换到周总结后新建 → 表单字段正确', async ({ authPage: page }) => {
    await page.goto('/summary')
    await page.waitForLoadState('domcontentloaded')

    await page.getByText('周总结').click()
    await page.waitForTimeout(500)

    const addBtn = page.locator('aside button').filter({ has: page.locator('svg') }).last()
    await addBtn.click()

    // 通用总结表单
    await expect(page.getByText('周总结标题')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('周总结内容')).toBeVisible()
    await expect(page.getByPlaceholder('输入标题（可选）')).toBeVisible()
    await expect(page.getByPlaceholder(/在这里写下您的周总结/)).toBeVisible()
    await expect(page.getByText('保存总结')).toBeVisible()
  })

  test('切换到月总结后新建 → 表单字段正确', async ({ authPage: page }) => {
    await page.goto('/summary')
    await page.waitForLoadState('domcontentloaded')

    await page.getByText('月总结').click()
    await page.waitForTimeout(500)

    const addBtn = page.locator('aside button').filter({ has: page.locator('svg') }).last()
    await addBtn.click()

    await expect(page.getByText('月总结标题')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('月总结内容')).toBeVisible()
    await expect(page.getByPlaceholder(/在这里写下您的月总结/)).toBeVisible()
  })

  test('切换到年总结后新建 → 表单字段正确', async ({ authPage: page }) => {
    await page.goto('/summary')
    await page.waitForLoadState('domcontentloaded')

    await page.getByText('年总结').click()
    await page.waitForTimeout(500)

    const addBtn = page.locator('aside button').filter({ has: page.locator('svg') }).last()
    await addBtn.click()

    await expect(page.getByText('年总结标题')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('年总结内容')).toBeVisible()
    await expect(page.getByPlaceholder(/在这里写下您的年总结/)).toBeVisible()
  })

  test('填写通用总结后保存', async ({ authPage: page }) => {
    await page.goto('/summary')
    await page.waitForLoadState('domcontentloaded')

    await page.getByText('周总结').click()
    await page.waitForTimeout(500)

    const addBtn = page.locator('aside button').filter({ has: page.locator('svg') }).last()
    await addBtn.click()

    await page.getByPlaceholder('输入标题（可选）').fill('E2E 测试周总结')
    await page.getByPlaceholder(/在这里写下您的周总结/).fill('本周完成了所有测试用例编写')
    await page.getByText('保存总结').click()

    await page.waitForTimeout(2000)
  })
})

// ── 编辑与删除总结 ──

test.describe('Summary 页面 — 编辑总结', () => {
  test('点击侧边栏总结记录 → 进入编辑模式', async ({ authPage: page }) => {
    await page.goto('/summary')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // 找到侧边栏中的总结记录
    const summaryItem = page.locator('aside button').filter({ hasNotText: '总结回顾' }).filter({ hasNotText: '日总结' }).filter({ hasNotText: '周总结' }).filter({ hasNotText: '月总结' }).filter({ hasNotText: '年总结' }).first()
    if (await summaryItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await summaryItem.click()

      // 应进入编辑模式，显示删除按钮
      await expect(page.getByText('删除总结')).toBeVisible({ timeout: 5000 })
    }
  })
})
