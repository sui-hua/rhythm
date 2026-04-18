# Direction 页面性能优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化 Direction 页面加载性能，将首次加载的 8 个并行 daily_plans 请求改为懒加载模式

**Architecture:** 
- 首次加载只获取 plans + monthlyPlans，然后预加载默认选中月的 dailyPlans
- 月份切换时清空旧缓存，懒加载新月的 dailyPlans
- plans_category 重复请求通过去重解决

**Tech Stack:** Vue 3 Composition API, Supabase

---

## 文件修改概览

| 文件 | 修改内容 |
|------|----------|
| `src/views/direction/composables/useDirectionFetch.js` | 修改 fetchData() 移除全量 dailyPlans 加载；添加 selectedMonth 监听 |
| `src/views/direction/composables/useDirectionState.js` | 添加 clearDailyPlansCache() 方法 |
| `src/views/direction/components/AddGoalModal.vue` | 检查 plans_category 重复请求 |

---

## Task 1: 修改 useDirectionState.js 添加清空缓存方法

**Files:**
- Modify: `src/views/direction/composables/useDirectionState.js:36-47`

- [ ] **Step 1: 添加 clearDailyPlansCache 函数**

在 `useDirectionState.js` 中，在 `getMonthlyPlansByPlanId` 函数后面添加：

```javascript
// 清空日计划缓存（保留指定的 monthlyPlanId）
export const clearDailyPlansCache = (keepMonthlyPlanId = null) => {
  if (keepMonthlyPlanId && dailyPlansCache[keepMonthlyPlanId]) {
    const keepData = dailyPlansCache[keepMonthlyPlanId]
    Object.keys(dailyPlansCache).forEach(key => {
      delete dailyPlansCache[key]
    })
    dailyPlansCache[keepMonthlyPlanId] = keepData
  } else {
    Object.keys(dailyPlansCache).forEach(key => {
      delete dailyPlansCache[key]
    })
  }
}
```

---

## Task 2: 修改 useDirectionFetch.js 实现懒加载

**Files:**
- Modify: `src/views/direction/composables/useDirectionFetch.js:99-167`
- Modify: `src/views/direction/composables/useDirectionFetch.js:169-184`

- [ ] **Step 1: 修改 fetchData() 移除全量 dailyPlans 加载**

找到 `fetchData()` 函数（约第99-167行），删除以下代码块（第124-141行）：

```javascript
// 删除这段 - 全量加载 dailyPlans
const dailyPlanGroups = await Promise.all(
  monthlyPlans.value.map(mp => db.dailyPlans.list(mp.id))
)
const allDailyPlans = dailyPlanGroups.flat()

for (const dp of allDailyPlans) {
  const mp = mpMap.get(dp.monthly_plan_id)
  if (mp) {
    const monthDate = parseDateOnly(mp.month)
    const dayDate = parseDateOnly(dp.day)
    if (!monthDate || !dayDate) continue

    const m = monthDate.getMonth() + 1
    const d = dayDate.getDate()
    const key = `plan-${mp.plan_id}-${m}-${d}`
    dailyTasks[key] = dp
  }
}
```

同时删除 `mpMap` 的创建（第119-122行），因为不再需要。

- [ ] **Step 2: 在 fetchData 末尾添加默认月份选中逻辑**

在 `fetchData()` 函数末尾（`selectedGoal.value = ...` 逻辑之后），添加：

```javascript
// 选中第一个目标的第一个月，并预加载该月 dailyPlans
if (selectedGoal.value && plans.value.length > 0) {
  const planId = selectedGoal.value.plan_id
  const cached = monthlyPlansCache[planId] || []
  if (cached.length > 0) {
    // 按月份排序，选中第一个月
    const sorted = [...cached].sort((a, b) => {
      const mA = getDateOnlyMonth(a.month) || 0
      const mB = getDateOnlyMonth(b.month) || 0
      return mA - mB
    })
    const firstMp = sorted[0]
    if (firstMp) {
      const firstMonth = getDateOnlyMonth(firstMp.month)
      if (firstMonth) {
        selectedMonth.value = firstMonth
        // 预加载该月的 dailyPlans
        await loadDailyPlans(firstMp.id, { force: true })
      }
    }
  }
}
```

需要修改 imports（在第21-36行）：
1. `selectedMonth` 添加到从 `@/views/direction/composables/useDirectionState` 的导入列表中
2. `getDateOnlyMonth` 添加到从 `@/views/direction/utils/dateOnly` 的导入列表中

- [ ] **Step 3: 添加 selectedMonth 监听**

在 `setupDone` 块中（约第169-184行），在 `onMounted` 块之前添加：

```javascript
watch(selectedMonth, async (newMonth, oldMonth) => {
  if (!newMonth || newMonth === oldMonth) return
  if (!selectedGoal.value) return

  const planId = selectedGoal.value.plan_id
  if (!planId) return

  const cached = monthlyPlansCache[planId] || []
  const mp = cached.find(item => getDateOnlyMonth(item.month) === newMonth)
  if (!mp) return

  // 清空其他月份的缓存，只保留新的
  clearDailyPlansCache(mp.id)
  // 加载新月份的 dailyPlans
  await loadDailyPlans(mp.id, { force: true })
})
```

需要导入 `clearDailyPlansCache`（已在 Task 1 中创建）。确认以下导入已在文件顶部：
- `selectedMonth` 从 `@/views/direction/composables/useDirectionState`
- `clearDailyPlansCache` 从 `@/views/direction/composables/useDirectionState`
- `getDateOnlyMonth` 从 `@/views/direction/utils/dateOnly`

---

## Task 3: 检查并修复 plans_category 重复请求

**Files:**
- Modify: `src/views/direction/components/AddGoalModal.vue`

- [ ] **Step 1: 检查 AddGoalModal 的 categories 加载逻辑**

读取 `AddGoalModal.vue` 中关于 `categories` 的加载逻辑（约第135行）：

```javascript
categories.value = await db.plansCategory.list()
```

检查是否在组件初始化时就调用了两次。可以通过添加防重机制或移到 `onMounted` 中解决。

如果存在重复调用，修改为：
```javascript
if (categories.value?.length > 0) return  // 已有数据则跳过
categories.value = await db.plansCategory.list()
```

---

## Task 4: 验证测试

- [ ] **Step 1: 启动开发服务器并访问 Direction 页面**

```bash
pnpm dev
```

- [ ] **Step 2: 检查网络请求**

打开 Chrome DevTools > Network 面板，确认：
1. `daily_plans` 请求数量：首次应该只有 1 个（默认选中月），而不是 8 个
2. `plans_category` 请求数量：应该只有 1 个
3. 月份切换时，应该只有 1 个新的 `daily_plans` 请求

- [ ] **Step 3: 功能验证**

1. 默认选中目标是否正确显示
2. 默认选中月是否正确加载 dailyPlans
3. 点击其他月份时，是否清空旧数据并加载新数据
4. 批量操作（添加/删除任务）是否正常工作
