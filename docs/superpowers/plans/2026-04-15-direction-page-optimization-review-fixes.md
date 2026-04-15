# Direction 页面优化 Review 修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 Direction 页面优化实现中的 5 个 review 问题，恢复懒加载目标、保证运行时不报错，并让新增目标与展开月份的行为正确。

**Architecture:** 保持现有“`monthlyPlansCache` / `dailyPlansCache` 为主、`monthlyPlans` / `dailyTasks` 为兼容层”的结构不变，只针对 review 暴露出的断点做收口。数据库侧先让 RPC 与真实 schema 对齐；前端侧修复主入口仍走全量加载、展开月份不触发日计划加载、以及新增目标后 sidebar 不刷新的问题。

**Tech Stack:** Vue 3 Composition API、Supabase、PostgreSQL、Vite、pnpm

---

## 文件结构与职责

- 修改：`database/schema.sql`
  责任：让 `batch_upsert_daily_plans()` 与 `daily_plans` 的真实表结构一致。
- 修改：`src/views/direction/composables/useDirectionFetch.js`
  责任：移除首屏 N+1 全量加载路径，收敛到 `loadPlans()` 为主入口。
- 修改：`src/views/direction/composables/useDirectionGoals.js`
  责任：补上 `loadMonthlyPlans` 引用，并在新增目标后同步 sidebar 所依赖的 `plans.value`。
- 修改：`src/views/direction/composables/useDirectionSelection.js`
  责任：展开月份时触发 `loadDailyPlans()`，让月格子和归档首次展开即可拿到数据。
- 修改：`src/views/direction/components/MissionBoard.vue`
  责任：保留 `selectedGoal` watcher，只负责目标切换后的月计划加载。

---

## Task 1: 修正 schema 与 RPC 字段不一致

**Files:**
- Modify: `database/schema.sql`

- [ ] **Step 1: 确认 `daily_plans` 表的真实字段集合**

```sql
CREATE TABLE daily_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_plan_id UUID REFERENCES monthly_plans(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
    day DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

- [ ] **Step 2: 将批量 upsert RPC 改成只写表中真实存在的列**

```sql
CREATE OR REPLACE FUNCTION batch_upsert_daily_plans(
  p_monthly_plan_id UUID,
  p_user_id UUID,
  p_items JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_plans (monthly_plan_id, user_id, day, title)
  SELECT
    p_monthly_plan_id,
    p_user_id,
    (item->>'date')::DATE,
    item->>'title'
  FROM jsonb_array_elements(p_items) AS item
  ON CONFLICT (monthly_plan_id, day)
  DO UPDATE SET
    title = EXCLUDED.title,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 3: 保持批量删除 RPC 不变，只复核字段名**

```sql
CREATE OR REPLACE FUNCTION batch_delete_daily_plans(
  p_monthly_plan_id UUID,
  p_days INT[]
) RETURNS VOID AS $$
BEGIN
  DELETE FROM daily_plans
  WHERE monthly_plan_id = p_monthly_plan_id
    AND EXTRACT(DAY FROM day)::INT = ANY(p_days);
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 4: 搜索仓库中对 `daily_plans.task_time/duration` 的误用**

Run: `rg -n "daily_plans|task_time|duration" database/schema.sql src/views/direction src/services/db`  
Expected: 确认 `task_time/duration` 只属于 `plans/monthly_plans` 相关逻辑，不再出现在 `daily_plans` 的 SQL 写入中。

- [ ] **Step 5: Commit**

```bash
git add database/schema.sql
git commit -m "fix: align direction batch rpc with daily_plans schema"
```

---

## Task 2: 移除首屏 N+1 全量加载路径

**Files:**
- Modify: `src/views/direction/composables/useDirectionFetch.js`

**说明**：`categorizedGoals` 是 `computed(() => { for (const plan of plans.value)... })`，只依赖 `plans.value`。简化后的 `fetchData` 可以正常工作，无需额外修改。

- [ ] **Step 1: 保留 `fetchData()` 作为兼容入口，但让它只加载 plans**

```js
const fetchData = async () => {
  try {
    await loadPlans()

    if (selectedGoal.value) {
      const currentId = selectedGoal.value.plan_id
      let found = null
      for (const cat of categorizedGoals.value) {
        found = cat.items.find(item => item.plan_id === currentId)
        if (found) break
      }
      selectedGoal.value = found || categorizedGoals.value[0]?.items?.[0] || null
    } else if (categorizedGoals.value.length > 0 && categorizedGoals.value[0].items.length > 0) {
      selectedGoal.value = categorizedGoals.value[0].items[0]
    }
  } catch (e) {
    console.error('Failed to fetch direction data', e)
  }
}
```

- [ ] **Step 2: 删除 `fetchData()` 中遍历所有 plan/monthlyPlan 的逻辑**

```js
// 删除这些旧逻辑： 
// for (const plan of plans.value) { await db.monthlyPlans.list(plan.id) }
// for (const mp of monthlyPlans.value) { await db.dailyPlans.list(mp.id) }
// 以及 allMonthlyPlans / allDailyPlans / mpMap 的全量构建
```

- [ ] **Step 3: 保留 `loadMonthlyPlans()` 和 `loadDailyPlans()` 作为唯一数据下钻入口**

```js
return {
  categorizedGoals,
  fetchData,
  loadPlans,
  loadMonthlyPlans,
  loadDailyPlans
}
```

- [ ] **Step 4: 手动验证首页请求行为**

Run: `pnpm dev`  
Expected: 首屏只请求 `plans`；不会再循环请求所有 `monthly_plans` 和 `daily_plans`。

- [ ] **Step 5: Commit**

```bash
git add src/views/direction/composables/useDirectionFetch.js
git commit -m "fix: remove eager direction fetch path"
```

---

## Task 3: 修复 `useDirectionGoals` 里的未定义调用与新增后 sidebar 不刷新

**Files:**
- Modify: `src/views/direction/composables/useDirectionGoals.js`
- Modify: `src/views/direction/composables/useDirectionFetch.js`

- [ ] **Step 1: 正确解构 `loadMonthlyPlans`**

```js
export function useDirectionGoals() {
  const authStore = useAuthStore()
  const { fetchData, loadMonthlyPlans } = useDirectionFetch()
```

- [ ] **Step 2: 保持编辑目标前按需加载月计划**

```js
const handleEditGoal = async (goal) => {
  if (!monthlyPlansCache[goal.plan_id]) {
    await loadMonthlyPlans(goal.plan_id)
  }
  const relatedMonthlyPlans = getMonthlyPlansByPlanId(goal.plan_id)
  // 后续继续用 relatedMonthlyPlans 计算范围
}
```

- [ ] **Step 3: 新增目标后同步更新 `plans.value`，再加载该目标月计划**

```js
const createdPlan = await db.plans.create(planData)
if (!createdPlan) return

plans.value = [...plans.value, createdPlan]
await Promise.all(promises)
await loadMonthlyPlans(createdPlan.id)

selectedGoal.value = {
  ...createdPlan,
  name: createdPlan.title,
  plan_id: createdPlan.id,
  category_name: createdPlan.plans_category?.name || '未分类'
}
showAddModal.value = false
```

- [ ] **Step 4: 如果新增后 `categorizedGoals` 依赖的字段不完整，则直接调用一次轻量 `fetchData()`**

```js
await Promise.all(promises)
await fetchData()
await loadMonthlyPlans(createdPlan.id)
```

Expected: 二选一。  
优先方案：只追加 `plans.value`。  
保守方案：新增成功后调用一次新的轻量 `fetchData()`，但不能回到旧的全量 N+1。

- [ ] **Step 5: 手动验证新增/编辑行为**

Run: `pnpm dev`  
Expected: 编辑未缓存目标不报 `loadMonthlyPlans is not defined`；新增目标后 sidebar 立即出现新目标。

- [ ] **Step 6: Commit**

```bash
git add src/views/direction/composables/useDirectionGoals.js src/views/direction/composables/useDirectionFetch.js
git commit -m "fix: stabilize direction goals loading flow"
```

---

## Task 4: 展开月份时按需加载 daily plans

**Files:**
- Modify: `src/views/direction/composables/useDirectionSelection.js`

- [ ] **Step 1: 在 `useDirectionSelection()` 中引入 `loadDailyPlans`**

```js
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

export function useDirectionSelection() {
  const { loadDailyPlans } = useDirectionFetch()
```

- [ ] **Step 2: 将 `toggleMonth()` 改为异步，在展开时触发该月加载**

```js
const toggleMonth = async (m) => {
  selectedMonth.value = selectedMonth.value === m ? null : m
  if (!selectedMonth.value) return

  if (!selectedDates[m]) selectedDates[m] = []

  const planId = selectedGoal.value?.plan_id
  if (!planId) return

  const monthlyPlansOfGoal = monthlyPlansCache[planId] || []
  const mp = monthlyPlansOfGoal.find(
    item => new Date(item.month).getMonth() + 1 === m
  )

  if (mp) {
    await loadDailyPlans(mp.id)
  }
}
```

- [ ] **Step 3: 保持 `hasTask()` 继续读取兼容层 `dailyTasks`**

```js
const hasTask = (m, day) => !!(dailyTasks[`${goalKey(m)}-${day}`]?.title)
```

- [ ] **Step 4: 手动验证首次展开某月的表现**

Run: `pnpm dev`  
Expected: 首次展开月份时就能看到 dot、归档和批量操作状态，不需要额外触发保存/删除后才刷新。

- [ ] **Step 5: Commit**

```bash
git add src/views/direction/composables/useDirectionSelection.js
git commit -m "fix: load direction daily plans on month expand"
```

---

## Task 5: 保持目标切换的月计划加载链路单一

**Files:**
- Modify: `src/views/direction/components/MissionBoard.vue`

- [ ] **Step 1: 保留 `selectedGoal` watcher，只负责加载该目标的 monthly plans**

```vue
<script setup>
import { watch } from 'vue'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import MissionBoardMonth from '@/views/direction/components/MissionBoardMonth.vue'

const { activeMonthRange } = useDirectionGoals()
const { endSelection, selectedGoal } = useDirectionSelection()
const { loadMonthlyPlans } = useDirectionFetch()

watch(selectedGoal, async (newGoal) => {
  if (newGoal) {
    await loadMonthlyPlans(newGoal.plan_id)
  }
})
</script>
```

- [ ] **Step 2: 确认没有第二条并行的“目标切换后再全量拉数据”路径**

Run: `rg -n "watch\\(selectedGoal|fetchData\\(|loadMonthlyPlans\\(" src/views/direction`  
Expected: 目标切换后的月计划加载入口清晰，不存在“一个 watcher 加载、另一个地方又整页 fetchData”的双通道。

- [ ] **Step 3: Commit**

```bash
git add src/views/direction/components/MissionBoard.vue
git commit -m "fix: keep direction goal switch loading explicit"
```

---

## Task 6: 最终验证

**Files:**
- Modify: `src/views/direction/composables/useDirectionFetch.js`
- Modify: `src/views/direction/composables/useDirectionGoals.js`
- Modify: `src/views/direction/composables/useDirectionSelection.js`
- Modify: `src/views/direction/components/MissionBoard.vue`
- Modify: `database/schema.sql`

- [ ] **Step 1: 运行构建**

Run: `pnpm build`  
Expected: 构建通过，无运行前静态错误。

- [ ] **Step 2: 手动验证 5 个 review finding**

Run: 手动测试 `/direction`  
Expected:
- 打开未缓存目标的编辑弹窗不报错
- 首屏不会全量加载所有 monthly/daily 数据
- 新增目标后 sidebar 立即出现新目标
- 展开某个月时能即时加载该月日计划
- 批量 RPC 调用不再引用 `daily_plans` 中不存在的字段

- [ ] **Step 3: Commit**

```bash
git add database/schema.sql src/views/direction/composables/useDirectionFetch.js src/views/direction/composables/useDirectionGoals.js src/views/direction/composables/useDirectionSelection.js src/views/direction/components/MissionBoard.vue
git commit -m "fix: address direction optimization review findings"
```

---

## Spec 覆盖检查

- RPC 与 schema 对齐：Task 1
- 首屏 N+1 清理：Task 2
- `loadMonthlyPlans` 未定义：Task 3
- 新增目标后 sidebar 不刷新：Task 3
- 展开月份不加载日计划：Task 4

## 计划备注

- 这份计划只修 review 暴露出的 5 个问题，不额外继续扩展 Direction 架构。
- `safeDb.rpc` 当前已经改为 `throw e`，本轮不再重复调整，只验证调用方行为。
- 如果在 Task 3 中发现“手动 append `plans.value`”会导致分类信息缺失，优先选“轻量 `fetchData()` + `loadMonthlyPlans(createdPlan.id)`”方案。
