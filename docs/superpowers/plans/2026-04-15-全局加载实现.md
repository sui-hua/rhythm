# Global Loading 全站加载动画 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为全站耗时请求建立统一加载反馈体系：慢请求顶部进度条、页面首屏骨架、写操作按钮 loading，并通过 Playwright-MCP 验收。

**Architecture:** 在 `src/composables/useGlobalLoading.js` 建立全局请求跟踪器（阈值显示 + 最短展示），在 `src/config/supabase.js` 统一接入 createBase CRUD/query，再补齐绕过 createBase 的直连查询。UI 层新增 `GlobalLoadingBar` 挂到 `App.vue`，页面层按“轻阻塞”原则逐页接入骨架与按钮态。

**Tech Stack:** Vue 3 (`<script setup>`), Pinia, Supabase JS, Tailwind CSS 4, Playwright-MCP, Vite

---

## 文件结构与职责映射

- Create: `src/composables/useGlobalLoading.js`（全局请求计数、延迟显示、最短展示、track 包装器）
- Create: `src/components/ui/GlobalLoadingBar.vue`（顶部进度条组件，A11y + 动画）
- Modify: `src/config/supabase.js`（createBase 的 list/getById/create/createMany/update/query/delete 全量接入 track）
- Modify: `src/services/db/habits.js`（`habit_logs` 直连查询接入 track）
- Modify: `src/services/db/summaries.js`（`daily_summaries` 直连查询接入 track）
- Modify: `src/App.vue`（挂载 `GlobalLoadingBar`）
- Modify: `src/views/direction/composables/useDirectionFetch.js`（增加页面级 `isPageLoading`）
- Modify: `src/views/habits/composables/useHabitData.js`（增加页面级 `isPageLoading`）
- Modify: `src/views/direction/index.vue`（骨架渲染）
- Modify: `src/views/habits/index.vue`（骨架渲染）
- Modify: `src/views/month/composables/useMonthView.js`、`src/views/year/composables/useYearView.js`、`src/views/summary/composables/useSummaryManager.js`（统一 page loading 行为）
- Modify: `src/views/day/composables/useAddEventForm.js`、`src/views/day/composables/useQuickAddForm.js`、`src/views/habits/composables/useHabitLogs.js`、`src/views/direction/composables/useDirectionGoals.js`（按钮 loading 粒度态）
- Test: `docs/superpowers/test-results/2026-04-15-global-loading-playwright-report.md`（Playwright-MCP 结果记录）

---

### Task 1: 建立全局 loading 跟踪器（核心状态层）

**Files:**
- Create: `src/composables/useGlobalLoading.js`

- [ ] **Step 1: 先写失败验证（临时调用片段）**

```js
// 在任意临时调试位（实现后删除）调用
import { beginGlobalLoading, endGlobalLoading, useGlobalLoading } from '@/composables/useGlobalLoading'
beginGlobalLoading()
setTimeout(() => endGlobalLoading(), 50)
// 预期：由于阈值 200ms，isGlobalLoading 不应闪现
```

- [ ] **Step 2: 运行页面观察失败现象**

Run: `pnpm dev`  
Expected: 目前项目无统一全局 loading 能力，无法满足“阈值显示 + 最短展示”。

- [ ] **Step 3: 写最小实现**

```js
// src/composables/useGlobalLoading.js
import { computed, ref } from 'vue'

const SHOW_DELAY_MS = 200
const MIN_VISIBLE_MS = 300
const pendingCount = ref(0)
const visible = ref(false)
let showTimer = null
let hideTimer = null
let visibleAt = 0

export function beginGlobalLoading() { /* +1 并延迟显示 */ }
export function endGlobalLoading() { /* -1 并最短展示后隐藏 */ }
export async function trackGlobalLoading(fn, options = {}) { /* try/finally */ }
export function useGlobalLoading() {
  return {
    isGlobalLoading: computed(() => visible.value),
    globalPendingCount: computed(() => pendingCount.value)
  }
}
```

- [ ] **Step 4: 运行验证通过**

Run: `pnpm build`  
Expected: BUILD SUCCESS，新增 composable 不引入构建错误。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useGlobalLoading.js
git commit -m "feat(loading): add global loading tracker with delay and min-visible time"
```

---

### Task 2: 把全局跟踪接入 Supabase 基础 CRUD/query

**Files:**
- Modify: `src/config/supabase.js`

- [ ] **Step 1: 写失败验证（读请求慢时无全局反馈）**

```js
// 通过浏览器 Network 节流为 Slow 4G 后打开 /day
// 预期失败：当前尚未统一接入，顶部全局进度不会稳定出现
```

- [ ] **Step 2: 先运行验证确认失败**

Run: `pnpm dev` + 手工慢网  
Expected: 现状不满足“所有 createBase 请求统一跟踪”。

- [ ] **Step 3: 写最小实现（createBase 全方法包裹）**

```js
import { trackGlobalLoading } from '@/composables/useGlobalLoading'

async list(options = {}) {
  return await trackGlobalLoading(async () => {
    // 原有 list 逻辑
  })
}
// getById/create/createMany/update/query/delete 同样包裹
```

- [ ] **Step 4: 构建验证**

Run: `pnpm build`  
Expected: BUILD SUCCESS。

- [ ] **Step 5: Commit**

```bash
git add src/config/supabase.js
git commit -m "feat(loading): wrap supabase createBase methods with global tracker"
```

---

### Task 3: 补齐直连查询（habit_logs/daily_summaries）

**Files:**
- Modify: `src/services/db/habits.js`
- Modify: `src/services/db/summaries.js`

- [ ] **Step 1: 写失败验证（直连查询漏网）**

```js
// 打开 habits/summary 相关页面并触发日志查询
// 预期失败：部分请求绕过 createBase，全局 loading 计数不完整
```

- [ ] **Step 2: 运行验证确认失败**

Run: `pnpm dev` + 触发习惯打卡日志与总结查询  
Expected: 进度反馈不一致。

- [ ] **Step 3: 写最小实现**

```js
import { trackGlobalLoading } from '@/composables/useGlobalLoading'

// habits.js
async listLogsByDate(...) {
  return await trackGlobalLoading(async () => {
    const { data, error } = await client.from('habit_logs')...
    if (error) throw error
    return data
  })
}
```

```js
// summaries.js
async listDaily() {
  return await trackGlobalLoading(async () => {
    const { data, error } = await client.from('daily_summaries')...
    if (error) throw error
    return data
  })
}
```

- [ ] **Step 4: 构建验证**

Run: `pnpm build`  
Expected: BUILD SUCCESS。

- [ ] **Step 5: Commit**

```bash
git add src/services/db/habits.js src/services/db/summaries.js
git commit -m "feat(loading): track direct db queries for habits and summaries"
```

---

### Task 4: 挂载顶部进度条组件（全站可见）

**Files:**
- Create: `src/components/ui/GlobalLoadingBar.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: 写失败验证（UI 层无全局条）**

```js
// 手工触发任意慢请求
// 预期失败：即使状态存在，也没有全站可见的进度条组件
```

- [ ] **Step 2: 写最小实现**

```vue
<!-- src/components/ui/GlobalLoadingBar.vue -->
<template>
  <Transition name="global-loading-fade">
    <div v-if="isGlobalLoading" class="global-loading" aria-live="polite" aria-label="页面加载中">
      <div class="global-loading-track"><div class="global-loading-bar" /></div>
    </div>
  </Transition>
</template>
<script setup>
import { useGlobalLoading } from '@/composables/useGlobalLoading'
const { isGlobalLoading } = useGlobalLoading()
</script>
<style scoped>
@reference "@/assets/tw-theme.css";
/* @apply 样式与关键帧动画 */
</style>
```

```vue
<!-- src/App.vue -->
<template>
  <Toaster />
  <GlobalLoadingBar />
  <Navbar ... />
</template>
```

- [ ] **Step 3: 构建验证**

Run: `pnpm build`  
Expected: BUILD SUCCESS（注意 Tailwind 4 组件样式必须 `@reference`）。

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/GlobalLoadingBar.vue src/App.vue
git commit -m "feat(loading): add global top loading bar and mount in app shell"
```

---

### Task 5: 页面级骨架（全站批次接入，先核心后补充）

**Files:**
- Modify: `src/views/direction/composables/useDirectionFetch.js`
- Modify: `src/views/habits/composables/useHabitData.js`
- Modify: `src/views/direction/index.vue`
- Modify: `src/views/habits/index.vue`
- Modify: `src/views/month/composables/useMonthView.js`
- Modify: `src/views/year/composables/useYearView.js`
- Modify: `src/views/summary/composables/useSummaryManager.js`

- [ ] **Step 1: 写失败验证（首屏空白/跳变）**

```js
// Slow 4G 打开 /direction 和 /habits
// 预期失败：关键内容区域出现空白等待，而非骨架
```

- [ ] **Step 2: 写最小实现（先核心页）**

```js
// useDirectionFetch.js / useHabitData.js
const isPageLoading = ref(false)
async function fetchDataOrHabits() {
  isPageLoading.value = true
  try { /* 原逻辑 */ } finally { isPageLoading.value = false }
}
```

```vue
<!-- direction/index.vue -->
<template>
  <div class="direction-main">
    <DirectionPageSkeleton v-if="isPageLoading" />
    <div v-else class="direction-content">...</div>
  </div>
</template>
```

- [ ] **Step 3: 补其余页面 page loading 对齐**

```js
// month/year/summary composable 中统一:
const isPageLoading = ref(false)
// 首屏 fetch 前 true，finally false
```

- [ ] **Step 4: 构建验证**

Run: `pnpm build`  
Expected: BUILD SUCCESS。

- [ ] **Step 5: Commit**

```bash
git add src/views/direction src/views/habits src/views/month/composables/useMonthView.js src/views/year/composables/useYearView.js src/views/summary/composables/useSummaryManager.js
git commit -m "feat(loading): add page-level skeleton loading across main views"
```

---

### Task 6: 写操作按钮 loading 统一接入（防重复提交）

**Files:**
- Modify: `src/views/day/composables/useAddEventForm.js`
- Modify: `src/views/day/composables/useQuickAddForm.js`
- Modify: `src/views/habits/composables/useHabitLogs.js`
- Modify: `src/views/direction/composables/useDirectionGoals.js`
- Modify: 以上对应按钮组件（若已有 loading 状态则复用）

- [ ] **Step 1: 写失败验证（可重复点击）**

```js
// 在保存/删除时快速连点
// 预期失败：会触发重复请求或重复 toast
```

- [ ] **Step 2: 写最小实现**

```js
const isSubmitting = ref(false)
const onSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try { /* 写操作 */ } finally { isSubmitting.value = false }
}
```

```vue
<Button :disabled="isSubmitting" @click="onSubmit">
  <span v-if="isSubmitting" class="spinner" />
  {{ isSubmitting ? '保存中...' : '保存' }}
</Button>
```

- [ ] **Step 3: 构建验证**

Run: `pnpm build`  
Expected: BUILD SUCCESS。

- [ ] **Step 4: Commit**

```bash
git add src/views/day/composables/useAddEventForm.js src/views/day/composables/useQuickAddForm.js src/views/habits/composables/useHabitLogs.js src/views/direction/composables/useDirectionGoals.js
git commit -m "feat(loading): add action-level loading guards for write operations"
```

---

### Task 7: Playwright-MCP 验收与结果归档

**Files:**
- Create: `docs/superpowers/test-results/2026-04-15-global-loading-playwright-report.md`

- [ ] **Step 1: 启动应用并准备测试**

Run: `pnpm dev`  
Expected: `http://localhost:5173` 可访问。

- [ ] **Step 2: 执行 6 条强制验收用例（Playwright-MCP）**

```text
1) 慢请求 >200ms 出现顶部进度条并消失
2) 快请求 <200ms 不出现进度条
3) /day /direction /habits 首屏骨架切换正常
4) 写操作按钮 loading+disabled 行为正确
5) 并发请求时进度条不提前消失
6) 失败请求后 loading 不残留
```

- [ ] **Step 3: 记录结果文档**

```md
# 2026-04-15 Global Loading Playwright 报告
- 环境：...
- 用例 1：PASS/FAIL（证据截图路径）
- ...
```

- [ ] **Step 4: 最终构建回归**

Run: `pnpm build`  
Expected: BUILD SUCCESS。

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/test-results/2026-04-15-global-loading-playwright-report.md
git commit -m "test(e2e): verify global loading UX with playwright-mcp"
```

---

## Spec 覆盖自检（对照 `2026-04-15-global-loading-design.md`）

- 覆盖“全站范围”：Task 5 + Task 6 指定核心页与补充页
- 覆盖“组合方案”：Task 4（顶部条）+ Task 5（骨架）+ Task 6（按钮态）
- 覆盖“慢请求阈值与最短展示”：Task 1 + Task 2
- 覆盖“轻阻塞策略”：Task 5
- 覆盖“Playwright-MCP 强制验收”：Task 7

占位词检查：无 `TODO/TBD/待定`。  
命名一致性检查：统一使用 `isGlobalLoading / isPageLoading / isSubmitting`。  
范围检查：聚焦“全站 loading 体验”，未引入无关重构。

