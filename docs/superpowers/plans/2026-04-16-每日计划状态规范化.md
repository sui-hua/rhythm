# Daily Plan Status Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `daily_plans.status` 类型不一致导致的“已完成未勾选/完成率统计错误”问题，并统一状态判定逻辑。

**Architecture:** 抽离一个单一职责的 `dailyPlanStatus` 工具函数，专门做“完成状态判定”和“写入值归一化”。`Day` 视图与 `Direction` 侧栏都改为依赖该工具，避免散落字符串/数字硬编码比较。通过最小单元测试覆盖历史值与当前 smallint 值，确保后续不回归。

**Tech Stack:** Vue 3 (Composition API), Vite 7, JavaScript, Vitest（新增用于轻量单测）

---

## File Structure

- Create: `src/utils/dailyPlanStatus.js`
  - 职责：统一判断 `daily_plans.status` 是否完成；统一把布尔完成态转换成数据库写入值（`0/1`）。
- Create: `src/utils/__tests__/dailyPlanStatus.spec.js`
  - 职责：覆盖 `0/1/'0'/'1'/'completed'/true/false/null/undefined` 等输入，验证判定与转换行为。
- Modify: `src/views/day/composables/useDayData.js`
  - 职责：将 `daily_plan` 的 `completed` 计算改为工具函数，避免直接字符串比较。
- Modify: `src/views/direction/components/DirectionSidebar.vue`
  - 职责：系统推进负载统计改为工具函数，保持与 Day 页口径一致。
- Modify: `package.json`
  - 职责：新增测试脚本 `test:unit`（若仓库尚无测试脚本）。

### Task 1: 引入状态归一化工具与测试基础

**Files:**
- Create: `src/utils/dailyPlanStatus.js`
- Create: `src/utils/__tests__/dailyPlanStatus.spec.js`
- Modify: `package.json`

- [ ] **Step 1: 新增 `dailyPlanStatus` 工具（最小实现）**

```js
// src/utils/dailyPlanStatus.js
export function isDailyPlanCompleted(status) {
  if (typeof status === 'number') return status === 1
  if (typeof status === 'string') return status === '1' || status === 'completed'
  return status === true
}

export function toDailyPlanStatus(completed) {
  return completed ? 1 : 0
}
```

- [ ] **Step 2: 新增单测（先写失败测试）**

```js
// src/utils/__tests__/dailyPlanStatus.spec.js
import { describe, it, expect } from 'vitest'
import { isDailyPlanCompleted, toDailyPlanStatus } from '@/utils/dailyPlanStatus'

describe('isDailyPlanCompleted', () => {
  it('returns true for completed statuses', () => {
    expect(isDailyPlanCompleted(1)).toBe(true)
    expect(isDailyPlanCompleted('1')).toBe(true)
    expect(isDailyPlanCompleted('completed')).toBe(true)
    expect(isDailyPlanCompleted(true)).toBe(true)
  })

  it('returns false for pending/invalid statuses', () => {
    expect(isDailyPlanCompleted(0)).toBe(false)
    expect(isDailyPlanCompleted('0')).toBe(false)
    expect(isDailyPlanCompleted(false)).toBe(false)
    expect(isDailyPlanCompleted(null)).toBe(false)
    expect(isDailyPlanCompleted(undefined)).toBe(false)
  })
})

describe('toDailyPlanStatus', () => {
  it('maps boolean to DB smallint convention', () => {
    expect(toDailyPlanStatus(true)).toBe(1)
    expect(toDailyPlanStatus(false)).toBe(0)
  })
})
```

- [ ] **Step 3: 增加测试脚本并安装依赖**

```json
{
  "scripts": {
    "test:unit": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.1.9"
  }
}
```

运行：

```bash
pnpm add -D vitest
pnpm test:unit
```

预期：首次运行若路径/别名配置有问题，测试失败并给出明确报错（例如别名 `@` 无法解析）。

- [ ] **Step 4: 修正测试运行环境使测试通过**

如出现别名解析错误，在 `vitest.config.js` 中添加最小配置：

```js
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'node'
  }
})
```

再次运行：

```bash
pnpm test:unit
```

预期：`dailyPlanStatus.spec.js` 全绿通过。

- [ ] **Step 5: 提交本任务**

```bash
git add package.json pnpm-lock.yaml src/utils/dailyPlanStatus.js src/utils/__tests__/dailyPlanStatus.spec.js vitest.config.js
git commit -m "test: add daily plan status normalization utility and unit tests"
```

### Task 2: Day 视图接入统一状态判断

**Files:**
- Modify: `src/views/day/composables/useDayData.js`
- Test: `src/utils/__tests__/dailyPlanStatus.spec.js`

- [ ] **Step 1: 先补失败用例（集成语义）**

在 `dailyPlanStatus.spec.js` 追加一个“真实业务语义”测试，覆盖 `smallint` 与旧值兼容：

```js
it('supports mixed legacy and smallint values for UI completion', () => {
  const statuses = [1, '1', 'completed', true, 0, '0', false]
  const mapped = statuses.map(isDailyPlanCompleted)
  expect(mapped).toEqual([true, true, true, true, false, false, false])
})
```

- [ ] **Step 2: 修改 Day 数据映射代码**

将原来的：

```js
completed: plan.status === 'completed'
```

替换为：

```js
import { isDailyPlanCompleted, toDailyPlanStatus } from '@/utils/dailyPlanStatus'

// ...
completed: isDailyPlanCompleted(plan.status)
```

并把切换写入统一为：

```js
const newStatus = toDailyPlanStatus(!task.completed)
await db.dailyPlans.update(task.id, { status: newStatus })
```

- [ ] **Step 3: 运行单测与构建校验**

```bash
pnpm test:unit
pnpm build
```

预期：单测通过，构建通过，且不新增 lint/类型错误。

- [ ] **Step 4: 提交本任务**

```bash
git add src/views/day/composables/useDayData.js src/utils/__tests__/dailyPlanStatus.spec.js
git commit -m "fix(day): normalize daily plan completion status mapping"
```

### Task 3: Direction 侧栏统计口径对齐

**Files:**
- Modify: `src/views/direction/components/DirectionSidebar.vue`
- Test: `src/utils/__tests__/dailyPlanStatus.spec.js`

- [ ] **Step 1: 增加失败测试（统计语义）**

在测试里加入一个“完成率计数”场景：

```js
it('counts completed items consistently for direction sidebar metric', () => {
  const tasks = [{ status: 1 }, { status: 'completed' }, { status: 0 }]
  const completed = tasks.filter(t => isDailyPlanCompleted(t.status)).length
  expect(completed).toBe(2)
})
```

- [ ] **Step 2: 修改 DirectionSidebar 统计逻辑**

将原来的：

```js
if (task.status === 'completed') completed++
```

替换为：

```js
import { isDailyPlanCompleted } from '@/utils/dailyPlanStatus'

if (isDailyPlanCompleted(task.status)) completed++
```

- [ ] **Step 3: 运行回归验证**

```bash
pnpm test:unit
pnpm build
```

预期：测试和构建通过；`Day` 勾选状态与 `Direction` 完成率口径一致。

- [ ] **Step 4: 提交本任务**

```bash
git add src/views/direction/components/DirectionSidebar.vue src/utils/__tests__/dailyPlanStatus.spec.js
git commit -m "fix(direction): align completion metric with normalized daily plan status"
```

### Task 4: 手动验收与风险兜底

**Files:**
- Modify: 无（验收任务）
- Test: 手工验收记录（可写入 PR 描述）

- [ ] **Step 1: 手工回归 Day 勾选链路**

运行：

```bash
pnpm dev
```

验收步骤：
- 选择任意存在 `daily_plan` 的日期；
- 点击未完成项 -> 应立即显示完成；
- 刷新页面 -> 仍保持完成；
- 再次点击 -> 回到未完成并持久化。

预期：UI 与数据库状态保持一致，无“点了但没勾选”的现象。

- [ ] **Step 2: 手工回归 Direction 负载统计**

验收步骤：
- 在同一个目标与月份下，记录当前 `systemLoad`；
- 在 Day 页对同月同目标的一条 daily plan 做完成/取消；
- 返回 Direction 页面观察百分比变化是否与实际完成数一致。

预期：百分比变化正确，无滞后与口径冲突。

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "fix: unify daily plan status semantics across day and direction views"
```

## Spec Coverage Check

- 需求“smallint(0/1) 与字符串比较导致勾选错误”：
  - Task 2 直接修复 Day 页映射；
  - Task 1 提供统一函数与测试保障；
  - Task 4 做手工闭环验证。
- 需求“检查是否还有同类问题”：
  - Task 3 覆盖 Direction 统计口径，避免另一处同类判断残留。

## Placeholder / Ambiguity Check

- 无 `TODO/TBD` 占位。
- 状态契约明确：读取兼容历史值，写入统一 `0/1`。
- 测试路径、命令、提交粒度均具体可执行。
