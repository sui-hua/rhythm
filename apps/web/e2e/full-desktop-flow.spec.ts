import { expect, test } from './auth.setup'
import type { Locator, Page } from '@playwright/test'

/**
 * 桌面端完整功能 E2E 覆盖
 *
 * 覆盖范围：
 * - 路由守卫、登录、登出
 * - 全局导航、Day / Month / Year 时间视图
 * - Day 任务新增、校验、编辑入口、删除清理
 * - Habits 新增、频率切换、快速记录、编辑入口、归档/删除入口
 * - Direction 新手引导、目标新增、月份范围、分类管理、延后展示开关
 * - Summary 日/周/月/年总结切换、新增、编辑入口、删除入口
 * - Notification diagnostics 公开诊断页
 */

// ── 常量 ──
// 固定日期让日/月/年视图截图和断言稳定，不受运行当天影响。
const STABLE_YEAR = 2026
const STABLE_MONTH = 6
const STABLE_DAY = 16

// 测试记录标题前缀，用于定位和清理本脚本创建的数据。
const RUN_PREFIX = `E2E 全功能 ${Date.now()}`

// ── 通用辅助函数 ──
// 等待页面基础加载完成，并给 Vue 异步渲染留出一个短稳定窗口。
async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(400)
}

// 等待页面骨架屏隐藏，避免在数据加载中点击空壳 UI。
async function waitForSkeletonGone(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const visibleSkeleton = Array.from(document.querySelectorAll('.animate-pulse, .habits-desktop-skeleton'))
      .some((node) => {
        const element = node as HTMLElement
        return element.offsetParent !== null
      })
    return !visibleSkeleton
  }, { timeout: 20000 })
}

// 判断多个候选定位器中是否至少有一个可见，用于兼容空状态和有数据状态。
async function expectOneVisible(candidates: Locator[]): Promise<void> {
  for (const candidate of candidates) {
    if (await candidate.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await expect(candidate.first()).toBeVisible()
      return
    }
  }
  throw new Error('Expected at least one candidate locator to be visible')
}

// 如果弹窗存在则按 Escape 关闭，确保后续步骤不被遮罩挡住。
async function closeDialogIfOpen(page: Page): Promise<void> {
  if (await page.getByRole('dialog').isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  }
}

// 点击 Direction 首次进入引导，已完成过引导时直接跳过。
async function completeDirectionGuideIfVisible(page: Page): Promise<void> {
  const startButton = page.getByRole('button', { name: '开始使用' })
  if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await startButton.click()
    await expect(startButton).not.toBeVisible({ timeout: 5000 })
  }
}

// ── 路由守卫与认证 ──
test.describe('全功能桌面流程 — 认证与路由守卫', () => {
  test('未登录访问受保护页面会回到登录页，演示账号可进入应用并登出', async ({ page }) => {
    const protectedRoutes = [
      '/',
      '/day/2026/6/16',
      '/month/2026/6',
      '/year/2026',
      '/habits',
      '/direction',
      '/summary',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    }

    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
    await expect(page.getByText('第一次使用建议')).toBeVisible()

    page.once('dialog', dialog => dialog.accept())
    await page.getByText('使用演示账号体验').click()
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 60000 })
    await expect(page).toHaveURL(/\/day/)

    await page.locator('button').filter({ has: page.locator('svg') }).last().click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })
})

// ── 导航与时间视图 ──
test.describe('全功能桌面流程 — 全局导航与时间视图', () => {
  test('顶部导航、日视图、月视图、年度视图都可访问并互相跳转', async ({ authPage: page }) => {
    await page.goto(`/day/${STABLE_YEAR}/${STABLE_MONTH}/${STABLE_DAY}`)
    await waitForPageReady(page)

    await expect(page.getByRole('button', { name: /时序/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /习惯/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /所向/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /总结/ })).toBeVisible()
    await expect(page.locator('header h2')).toHaveText(String(STABLE_DAY), { timeout: 10000 })

    await page.goto(`/month/${STABLE_YEAR}/${STABLE_MONTH}`)
    await waitForPageReady(page)
    await expect(page.getByText(String(STABLE_YEAR))).toBeVisible()
    await expect(page.getByText(/JUNE/i)).toBeVisible()
    await page.getByText(String(STABLE_DAY), { exact: true }).first().click()
    await expect(page).toHaveURL(new RegExp(`/day/${STABLE_YEAR}/${STABLE_MONTH}/${STABLE_DAY}`), { timeout: 10000 })

    await page.goto(`/year/${STABLE_YEAR}`)
    await waitForPageReady(page)
    await expect(page.getByText(String(STABLE_YEAR))).toBeVisible()
    await page.getByText(/JUNE/i).first().click()
    await expect(page).toHaveURL(new RegExp(`/month/${STABLE_YEAR}/${STABLE_MONTH}`), { timeout: 10000 })

    await page.goto('/month')
    await expect(page).toHaveURL(/\/month\/\d{4}\/\d{1,2}/, { timeout: 10000 })
    await page.goto('/year')
    await expect(page).toHaveURL(/\/year\/\d{4}/, { timeout: 10000 })
  })
})

// ── Day 模块 ──
test.describe('全功能桌面流程 — Day 时序模块', () => {
  test('任务可以新增、校验、打开编辑入口并删除清理', async ({ authPage: page }) => {
    const taskTitle = `${RUN_PREFIX} 任务`

    await page.goto(`/day/${STABLE_YEAR}/${STABLE_MONTH}/${STABLE_DAY}`)
    await waitForPageReady(page)
    await expect(page.getByText('任务完成度')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('提醒设置')).toBeVisible()

    await page.getByText('添加项目').click()
    await expect(page.locator('h1:text("新增任务")')).toBeVisible()
    await page.locator('#title').focus()
    await page.locator('#title').blur()
    await expect(page.getByText('任务名称不能为空')).toBeVisible({ timeout: 3000 })

    await page.locator('#title').fill(taskTitle)
    await page.locator('#description').fill('覆盖 Day 新增、编辑入口和删除清理')
    await page.getByRole('button', { name: '个人' }).click()
    await page.getByRole('button', { name: '确认创建' }).click()
    await expect(page.locator('h1:text("新增任务")')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 })

    await page.getByText(taskTitle).first().dblclick()
    await expect(page.locator('h1:text("编辑任务")')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('保存修改')).toBeVisible()

    page.once('dialog', dialog => dialog.accept())
    await page.getByText('删除此任务').click()
    await expect(page.locator('h1:text("编辑任务")')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(taskTitle)).not.toBeVisible({ timeout: 10000 })
  })
})

// ── Habits 模块 ──
test.describe('全功能桌面流程 — Habits 习惯模块', () => {
  test('习惯列表、添加表单、频率切换、快速记录和编辑入口可用', async ({ authPage: page }) => {
    const habitTitle = `${RUN_PREFIX} 习惯`

    await page.goto('/habits')
    await waitForPageReady(page)
    await expect(page.locator('.habits-desktop-root')).toBeVisible({ timeout: 10000 })
    await waitForSkeletonGone(page)
    await expectOneVisible([
      page.locator('.habits-desktop-content'),
      page.locator('.habits-empty-state'),
    ])

    await page.getByText('添加项目').first().click()
    await expect(page.getByText('添加新习惯')).toBeVisible({ timeout: 10000 })
    await page.locator('#habit-title').focus()
    await page.locator('#habit-title').blur()
    await expect(page.getByText('请输入习惯名称')).toBeVisible({ timeout: 3000 })

    await page.locator('#habit-title').fill(habitTitle)
    await page.getByText('每周', { exact: true }).first().click()
    await expect(page.getByText('选择每周执行的星期')).toBeVisible()
    await page.getByText('一', { exact: true }).first().click()
    await page.getByText('五', { exact: true }).first().click()
    await page.getByText('每月', { exact: true }).first().click()
    await expect(page.getByText('选择每月执行的日期')).toBeVisible()
    await page.getByText('1', { exact: true }).first().click()
    await page.getByText('每日', { exact: true }).first().click()
    await page.getByRole('button', { name: '确认创建' }).click()
    await expect(page.getByText('添加新习惯')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(habitTitle)).toBeVisible({ timeout: 10000 })

    await page.getByText(habitTitle).first().click()
    await expect(page.locator('.habits-desktop-content')).toBeVisible({ timeout: 10000 })

    const noteInput = page.getByPlaceholder('记录今天的习惯心得...')
    if (await noteInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await noteInput.fill('完整 E2E 快速记录')
      await noteInput.press('Enter')
      await expect(noteInput).toHaveValue('', { timeout: 5000 })
    }

    await page.getByText(habitTitle).first().dblclick()
    await expect(page.getByText('修改习惯')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('保存修改')).toBeVisible()
    await expectOneVisible([
      page.getByText('归档该习惯'),
      page.getByText('取消归档'),
    ])
    await expect(page.getByText('删除该习惯')).toBeVisible()

    page.once('dialog', dialog => dialog.accept())
    await page.getByText('删除该习惯').click()
    await expect(page.getByText('修改习惯')).not.toBeVisible({ timeout: 10000 })
  })
})

// ── Direction 模块 ──
test.describe('全功能桌面流程 — Direction 所向模块', () => {
  test('新手引导、目标新增表单、分类管理和延后展示开关可用', async ({ authPage: page }) => {
    const goalTitle = `${RUN_PREFIX} 目标`

    await page.goto('/direction')
    await waitForPageReady(page)
    await waitForSkeletonGone(page)
    await completeDirectionGuideIfVisible(page)
    await expect(page.locator('.direction-content')).toBeVisible({ timeout: 10000 })

    const addGoalButton = page.getByRole('button', { name: '添加目标' })
    await expect(addGoalButton).toBeVisible({ timeout: 10000 })
    await addGoalButton.click()
    await expect(page.getByText('添加新目标')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#goal-title')).toBeVisible()
    await expect(page.getByText('开始月份')).toBeVisible()
    await expect(page.getByText('结束月份')).toBeVisible()
    await expect(page.getByText('目标分类')).toBeVisible()
    await expect(page.getByText('任务时间')).toBeVisible()
    await expect(page.getByText('预计时长')).toBeVisible()

    await page.getByRole('button', { name: '开启', exact: true }).click()
    await expect(page.getByText('延后展示天数')).toBeVisible()
    await page.locator('#goal-carry-over-days').fill('3')
    await page.getByRole('button', { name: '关闭', exact: true }).click()
    await expect(page.getByText('延后展示天数')).not.toBeVisible()

    await page.getByText('管理类型').click()
    await expectOneVisible([
      page.getByText('类型'),
      page.getByPlaceholder(/类型|分类/),
      page.locator('[class*="category"]').first(),
    ])
    await closeDialogIfOpen(page)

    await addGoalButton.click()
    await page.locator('#goal-title').fill(goalTitle)
    await page.getByRole('button', { name: '确认创建' }).click()
    await expect(page.getByText('添加新目标')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(goalTitle)).toBeVisible({ timeout: 15000 })
  })
})

// ── Summary 模块 ──
test.describe('全功能桌面流程 — Summary 总结模块', () => {
  test('日/周/月/年总结切换、新建、编辑入口和删除入口可用', async ({ authPage: page }) => {
    await page.goto('/summary')
    await waitForPageReady(page)
    await expect(page.getByText('总结回顾')).toBeVisible({ timeout: 10000 })

    for (const tabName of ['日总结', '周总结', '月总结', '年总结']) {
      await page.getByText(tabName, { exact: true }).click()
      await waitForPageReady(page)
      await expect(page.getByText(tabName, { exact: true })).toBeVisible()
    }

    await page.getByText('日总结', { exact: true }).click()
    await page.locator('aside button').filter({ has: page.locator('svg') }).last().click()
    await expect(page.getByText('今日成就')).toBeVisible({ timeout: 10000 })
    await page.getByPlaceholder('今天完成了哪些重要事情？').fill(`${RUN_PREFIX} 日总结成就`)
    await page.getByPlaceholder('有哪些地方可以做得更好？').fill('继续提高自动化覆盖')
    await page.getByPlaceholder('明天最优先处理的任务是什么？').fill('复查关键流程')
    await page.getByText('保存今日总结').click()
    await waitForPageReady(page)
    await expect(page.getByText(`${RUN_PREFIX} 日总结成就`).first()).toBeVisible({ timeout: 15000 })

    await page.getByText(`${RUN_PREFIX} 日总结成就`).first().click()
    await expect(page.getByText('删除总结')).toBeVisible({ timeout: 10000 })
    await page.getByText('取消').click()

    await page.getByText('周总结', { exact: true }).click()
    await page.locator('aside button').filter({ has: page.locator('svg') }).last().click()
    await expect(page.getByText('周总结标题')).toBeVisible({ timeout: 10000 })
    await page.getByPlaceholder('输入标题（可选）').fill(`${RUN_PREFIX} 周总结标题`)
    await page.getByPlaceholder(/在这里写下您的周总结/).fill('覆盖通用总结表单')
    await page.getByText('保存总结').click()
    await waitForPageReady(page)
    await expect(page.getByText(`${RUN_PREFIX} 周总结标题`).first()).toBeVisible({ timeout: 15000 })
  })
})

// ── 通知诊断页 ──
test.describe('全功能桌面流程 — Notification diagnostics', () => {
  test('公开通知诊断页可刷新状态、检查图标并写入日志', async ({ page }) => {
    await page.context().grantPermissions(['notifications'])
    await page.goto('/notification-test')
    await waitForPageReady(page)

    await expect(page.getByText('通知测试')).toBeVisible()
    await expect(page.getByText('Notification API')).toBeVisible()
    await expect(page.getByText('Service Worker')).toBeVisible()
    await expect(page.getByText('通知图标')).toBeVisible()

    await page.getByRole('button', { name: '刷新状态' }).click()
    await page.getByRole('button', { name: '检查图标' }).click()
    await expect(page.getByText(/图标检查完成|状态已刷新/).first()).toBeVisible({ timeout: 10000 })
  })
})
