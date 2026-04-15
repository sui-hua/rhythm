# Direction 页面优化设计方案（优化版）

> **Goal:** 解决 Direction 页面的性能问题（N+1 查询）、批量操作体验、以及一系列 UX/代码质量问题  
> **Architecture:** 三层按需懒加载 + Supabase RPC 批量操作 + 数据一致性约束

---

## 1. 数据加载重构（按需懒加载）

### 当前问题

`useDirectionFetch.js` 的 `fetchData` 在 `onMounted` 时：
1. 加载所有 plans
2. for 循环每个 plan，单独查询 monthlyPlans（N 次请求）
3. for 循环每个 monthlyPlan，单独查询 dailyPlans（M 次请求）

总请求数 = `1 + N(plans) + M(monthlyPlans)`

### 改造方案

分层加载，缓存到内存：

```text
onMounted:
  └── loadPlans()                    // 只加载 plans 列表

选择目标时:
  └── loadMonthlyPlans(planId)       // 只加载该目标的 monthlyPlans，存入 monthlyPlansCache

展开月份时:
  └── loadDailyPlans(monthlyPlanId)  // 只加载该月的 dailyPlans，存入 dailyPlansCache
```

### 新增状态（useDirectionState.js）

```js
// 现有
export const plans = ref([])
// monthlyPlans 继续保留，作为“已加载 monthlyPlans 的扁平兼容视图”
export const monthlyPlans = ref([])

// 新增分层缓存
export const monthlyPlansCache = reactive({}) // { [planId]: monthlyPlan[] }
export const dailyPlansCache = reactive({})   // { [monthlyPlanId]: dailyPlan[] }

// 用于归档视图刷新（避免 setTimeout 强刷）
export const archiveVersion = ref(0)
```

### 加载函数（useDirectionFetch.js）

```js
const loadPlans = async () => {
  plans.value = await db.plans.list()
}

const loadMonthlyPlans = async (planId) => {
  if (monthlyPlansCache[planId]) return
  monthlyPlansCache[planId] = await db.monthlyPlans.list(planId)
}

// 将单个目标的缓存合并回 monthlyPlans，兼容仍依赖扁平列表的旧逻辑
const syncMonthlyPlansToFlatList = (planId) => {
  const cached = monthlyPlansCache[planId] || []
  const others = monthlyPlans.value.filter(item => item.plan_id !== planId)
  monthlyPlans.value = [...others, ...cached]
}

const loadDailyPlans = async (monthlyPlanId, { force = false } = {}) => {
  if (!force && dailyPlansCache[monthlyPlanId]) return
  const dps = await db.dailyPlans.list(monthlyPlanId)
  dailyPlansCache[monthlyPlanId] = dps

  // 兼容旧逻辑：同步到 dailyTasks（plan-planId-month-day）
  const mp = Object.values(monthlyPlansCache)
    .flat()
    .find(item => item.id === monthlyPlanId)
  if (!mp) return

  const month = new Date(mp.month).getMonth() + 1
  const prefix = `plan-${mp.plan_id}-${month}-`

  // 先清理该月旧 key，避免已删除日期残留
  for (const key of Object.keys(dailyTasks)) {
    if (key.startsWith(prefix)) {
      delete dailyTasks[key]
    }
  }

  for (const dp of dps) {
    const day = new Date(dp.day).getDate()
    const key = `plan-${mp.plan_id}-${month}-${day}`
    dailyTasks[key] = dp
  }
}
```

### 触发时机

- `onMounted` → `loadPlans()`
- `selectGoal(goal)` → `loadMonthlyPlans(goal.plan_id)` + `syncMonthlyPlansToFlatList(goal.plan_id)`
- `toggleMonth(m)` 展开月份时 → 找到该月对应 `monthlyPlanId` → `loadDailyPlans(monthlyPlanId)`

### 向后兼容

采用 **方案 A（修正版）**：`monthlyPlans.value` 保留，但不再表示“当前选中目标”，而是表示“当前已加载缓存的扁平镜像”。

`dailyTasks` 保持兼容层，不再作为主数据源。统一规则：
- 主数据源：`dailyPlansCache[monthlyPlanId]`
- 兼容层：在 `loadDailyPlans` 成功后，同步映射到 `dailyTasks`（若旧组件仍依赖 `plan-month-day` 结构）
- 同步策略：先按 `planId + month` 清空旧 key，再批量写入新值，避免 UI 读到过期日期
- 新逻辑优先读取缓存，旧逻辑逐步迁移

补充约束：
- `categorizedGoals`
- `handleEditGoal`
- `updateGoalData`
- `saveMonthlyPlan`
- `systemLoad`

以上逻辑如果需要“某个目标的完整 month 集合”，应优先通过 `monthlyPlansCache[planId]` 或封装 helper 获取，不能再假设 `monthlyPlans.value.filter(...)` 一定拿到完整数据。

建议补一个统一 helper：

```js
const getMonthlyPlansByPlanId = (planId) => monthlyPlansCache[planId] || []
```

### 1.1 目标范围展示的收口方案

这次不在 `plans` 表新增范围字段，目标范围继续由 `monthly_plans` 推导。

统一约束：
- Sidebar 不需要在未点击目标前预先展示精确范围
- `handleEditGoal` 打开前，如当前目标未加载 `monthlyPlansCache[planId]`，先补一次 `loadMonthlyPlans(planId)`
- `categorizedGoals` 不再依赖 `monthly_plans` 反推范围，只保留 `plan_id / title / category` 等轻量信息
- 需要精确范围的地方，只在该目标已加载后，通过 `monthlyPlansCache[planId]` 计算 `startMonth/endMonth`

这样可以保住懒加载，不为了范围展示重新引入首屏全量查询。

---

## 2. 批量操作 RPC（并发安全版）

### 2.0 前置改造（服务层能力）

当前 `src/services/database.js` 与 `src/services/safeDb.js` 没有 `rpc` 能力，落地前需要补一个统一入口，例如：

```js
// database.js
import client from '@/config/supabase'

export const db = {
  ...tables,
  rpc(name, params) {
    return client.rpc(name, params)
  }
}
```

如果批量操作入口最终走 `safeDb`，则 `safeDb` 也需要透传 `rpc` 并补错误处理。

### 2.05 字段命名统一（daily_plans）

当前代码里 `daily_plans` 的日期字段存在 `day` / `date` 混用风险。实现本方案前需要统一成单一字段名。

以当前 `database/schema.sql` 为准，推荐统一使用 `day`：

- RPC 入参中的日期字符串最终写入 `daily_plans.day`
- 前端读取统一使用 `dp.day`
- `db.dailyPlans.create()` / `listByDate()` 中的 `date` 用法需要同步修正，避免新旧代码混用

### 2.1 数据一致性前置约束（database/schema.sql）

先确保唯一约束，避免并发重复写入：

```sql
ALTER TABLE daily_plans
ADD CONSTRAINT uq_daily_plans_monthly_day UNIQUE (monthly_plan_id, day);
```

> 如果历史数据可能冲突，先清洗重复数据再加约束。

### 2.2 批量新增/修改 RPC

`p_items` 字段统一为 `date/title/task_time/duration`，避免与示例混淆。

```sql
CREATE OR REPLACE FUNCTION batch_upsert_daily_plans(
  p_monthly_plan_id UUID,
  p_user_id UUID,
  p_items JSONB -- [{date: "2026-04-01", title: "xxx", task_time: "09:00", duration: 30}, ...]
) RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_plans (monthly_plan_id, user_id, day, title, task_time, duration)
  SELECT
    p_monthly_plan_id,
    p_user_id,
    (item->>'date')::DATE,
    item->>'title',
    NULLIF(item->>'task_time', ''),
    NULLIF(item->>'duration', '')::INT
  FROM jsonb_array_elements(p_items) AS item
  ON CONFLICT (monthly_plan_id, day)
  DO UPDATE SET
    title = EXCLUDED.title,
    task_time = EXCLUDED.task_time,
    duration = EXCLUDED.duration,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 2.3 批量删除 RPC

删除函数参数改为 `INT[]`，与 `ANY` 语义一致：

```sql
CREATE OR REPLACE FUNCTION batch_delete_daily_plans(
  p_monthly_plan_id UUID,
  p_days INT[] -- 例如 ARRAY[1, 2, 3]
) RETURNS VOID AS $$
BEGIN
  DELETE FROM daily_plans
  WHERE monthly_plan_id = p_monthly_plan_id
    AND EXTRACT(DAY FROM day)::INT = ANY(p_days);
END;
$$ LANGUAGE plpgsql;
```

### 2.4 前端调用（useDirectionBatch.js）

```js
const applyBatchTask = async () => {
  const cachedPlans = monthlyPlansCache[selectedGoal.value.plan_id] || []
  const currentMp = cachedPlans.find(mp => new Date(mp.month).getMonth() + 1 === m)
  if (!currentMp) return
  const year = new Date(currentMp.month).getFullYear()

  let daysToUpdate = selectedDates[m].filter(day => hasTask(m, day))
  if (daysToUpdate.length === 0) {
    daysToUpdate = [...selectedDates[m]]
  }

  const items = daysToUpdate.map(day => ({
    date: `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    title: batchInput.value,
    task_time: null,
    duration: null
  }))

  await db.rpc('batch_upsert_daily_plans', {
    p_monthly_plan_id: currentMp.id,
    p_user_id: authStore.userId,
    p_items: items
  })

  await loadDailyPlans(currentMp.id, { force: true })
  archiveVersion.value++
  batchInput.value = ''
  selectedDates[m] = []
}

const handleBatchDelete = async () => {
  if (!selectedDates[m] || selectedDates[m].length === 0) return
  const cachedPlans = monthlyPlansCache[selectedGoal.value.plan_id] || []
  const currentMp = cachedPlans.find(mp => new Date(mp.month).getMonth() + 1 === m)
  if (!currentMp) return

  await db.rpc('batch_delete_daily_plans', {
    p_monthly_plan_id: currentMp.id,
    p_days: selectedDates[m]
  })

  await loadDailyPlans(currentMp.id, { force: true })
  archiveVersion.value++
  selectedDates[m] = []
}
```

---

## 3. 批量混选问题修复

### 问题

`canSelect` 允许用户混选“有任务日期”和“空白日期”，导致更新操作可能误创建任务。

### 修复

更新逻辑中明确区分“更新已有任务”和“纯新建”：

```js
let daysToUpdate = selectedDates[m].filter(day => hasTask(m, day))
if (daysToUpdate.length === 0) {
  // 全是空白日期时，按新建处理
  daysToUpdate = [...selectedDates[m]]
}
```

`isAllSelectedDatesHaveTask` 检查保持不变：只有全选已有任务日期时，才允许走“修改”入口。

---

## 4. 缩范围级联删除修复

### 问题

`updateGoalData` 删除超出范围的 monthlyPlans 时，没有稳定删除其关联 dailyPlans，存在一致性风险。

### 修复

优先使用数据库级联约束。由于线上约束名可能不是固定值，先查询再迁移：

```sql
SELECT conname
FROM pg_constraint
WHERE conrelid = 'daily_plans'::regclass
  AND confrelid = 'monthly_plans'::regclass;
```

在 migration 中按查询结果替换真实约束名后再执行：

```sql
ALTER TABLE daily_plans
DROP CONSTRAINT IF EXISTS <existing_fk_name>;

ALTER TABLE daily_plans
ADD CONSTRAINT daily_plans_monthly_plan_id_fkey
FOREIGN KEY (monthly_plan_id)
REFERENCES monthly_plans(id)
ON DELETE CASCADE;
```

前端删除只保留 monthlyPlan 删除（事务由数据库保证）：

```js
await Promise.all(toDelete.map(mp => db.monthlyPlans.delete(mp.id)))
```

---

## 5. 范围修改状态跨目标残留修复

### 问题

`GoalRangePicker` 的 `localStart/localEnd` 在切换目标后可能残留旧值。

### 修复

在 `selectGoal` 中重置范围编辑态：

```js
const selectGoal = (g) => {
  selectedGoal.value = g
  selectedMonth.value = null
  activePicker.value = 'start'
}
```

`GoalRangePicker` 内 `watch` 同步 props 到 `localStart/localEnd`。

---

## 6. 月份偏移硬编码年份修复

### 问题

`getMonthOffset(month)` 使用 `new Date().getFullYear()` 硬编码今年，跨年目标显示错位。

### 修复

```js
const getMonthOffset = (month) => {
  if (!selectedGoal.value) {
    // fallback：使用当前年该月 1 号的 weekday
    return new Date(new Date().getFullYear(), month - 1, 1).getDay()
  }

  const planId = selectedGoal.value.plan_id
  const cached = monthlyPlansCache[planId] || []
  const mp = cached.find(m => new Date(m.month).getMonth() + 1 === month)

  if (mp) {
    const year = new Date(mp.month).getFullYear()
    return new Date(year, month - 1, 1).getDay()
  }

  return new Date(new Date().getFullYear(), month - 1, 1).getDay()
}
```

---

## 7. ArchiveItem 保存副作用修复

### 问题

`@keyup.enter` 触发 `blur` 再触发保存，连续编辑时可能出现状态混乱或重复提交。

### 修复

改为单一提交入口（`@change` 或显式按钮）：

```vue
<input
  class="archive-input"
  :value="task.title"
  @change="(e) => handleUpdateTask({ ...task, title: e.target.value })"
/>
```

如需“回车保存”，统一走 `saveTask`，避免和 `blur` 重复触发。

---

## 8. 批量操作后归档不刷新修复

### 问题

批量操作后 `dailyTasks` 更新，但 `MissionArchive` 的 `datesWithTasks` 未必感知缓存变更。

### 修复

去掉 `selectedMonth = null + setTimeout` 强刷方案，改为显式依赖版本号，并给出真实可实现的计算逻辑：

```js
const datesWithTasks = computed(() => {
  archiveVersion.value // 建立依赖
  const planId = selectedGoal.value?.plan_id
  if (!planId || selectedMonth.value == null) return []

  const monthlyPlansOfGoal = monthlyPlansCache[planId] || []
  const mp = monthlyPlansOfGoal.find(
    item => new Date(item.month).getMonth() + 1 === selectedMonth.value
  )
  if (!mp) return []

  const dps = dailyPlansCache[mp.id] || []
  return dps
    .filter(dp => dp.title)
    .map(dp => new Date(dp.day).getDate())
    .sort((a, b) => a - b)
})
```

批量新增/删除成功后执行：

```js
archiveVersion.value++
```

兼容处理：如果 `MissionArchive` 仍有分支读取 `dailyTasks`，则在 `loadDailyPlans` 后同步一次 `dailyTasks`，避免新旧路径混读导致显示不一致。

---

## 9. 文案命名修复

| 原名 | 新名 |
|------|------|
| 系统推进负载 | 本月进度 |

---

## 10. months 常量统一

`useDirectionState.js` 统一导出 `months`，其它模块复用：

```js
import { months } from '@/views/direction/composables/useDirectionState'
```

删除 `AddGoalModal.vue` 本地静态 `months` 定义。

---

## 11. ArchiveHeader 无用 prop 修复

删除 `MissionArchive.vue` 对 `ArchiveHeader` 的 `:months="months"` 冗余传参。

---

## 12. 验收标准（新增）

1. 进入 `/direction` 首屏请求数显著下降，不再出现按 `plan/month` 级联全量请求。
2. 连续执行批量新增/修改/删除后，归档视图即时更新，无 `setTimeout` 刷新 hack。
3. 并发触发批量 upsert 不会产生同月同日重复记录。
4. 缩小范围删除后，`monthly_plans` 与 `daily_plans` 数据保持一致（无孤儿记录）。
5. 跨年目标（如 2025-12 到 2026-02）月份偏移正确。

---

## 文件改动清单

| 文件 | 改动类型 |
|------|----------|
| `composables/useDirectionState.js` | 新增缓存状态与 `archiveVersion` |
| `composables/useDirectionFetch.js` | 分层懒加载 + `force` 刷新 |
| `composables/useDirectionSelection.js` | `selectGoal` 增加状态重置 |
| `composables/useDirectionBatch.js` | RPC 批量操作 + 过滤逻辑 + 显式刷新 |
| `composables/useDirectionGoals.js` | 编辑前按需加载 monthlyPlans + 删除逻辑收敛为删除 monthlyPlan |
| `components/GoalRangePicker.vue` | `getMonthOffset` 按目标年份计算 |
| `components/ArchiveItem.vue` | 去除 blur 双提交副作用 |
| `components/MissionArchive.vue` | 改为依赖 `archiveVersion` |
| `components/DirectionSidebar.vue` | 文案改名 |
| `components/AddGoalModal.vue` | 统一 `months` 引用 |
| `database/schema.sql` | 唯一约束 + 级联外键 + 两个 RPC |

---

## 优先级排序

1. **数据库约束 + RPC 并发安全改造**（先确保数据不会错）
2. **数据懒加载**（解决首屏慢）
3. **级联删除与归档刷新链路**（解决一致性 + 可见性）
4. **其余 UX 与命名修复**
