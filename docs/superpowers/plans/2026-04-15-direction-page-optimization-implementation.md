# Direction 页面优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 Direction 页面的懒加载、批量操作、数据一致性与 UI 状态修复，确保首屏更快且旧交互不回退。

**Architecture:** 以 `monthlyPlansCache` / `dailyPlansCache` 作为新主数据源，保留 `monthlyPlans` / `dailyTasks` 作为兼容镜像；数据库侧补唯一约束、级联删除与 RPC 批量操作；前端逐步把读取逻辑从“全量列表 + key 字符串”切换到“缓存 + helper”，目标范围继续由 `monthly_plans` 在需要时推导。

**Tech Stack:** Vue 3 Composition API、Pinia、Supabase、PostgreSQL、Vite、pnpm

---

## 文件结构与职责

### 数据库与服务层

- 修改：`database/schema.sql`
  责任：补 `daily_plans` 约束、级联外键、RPC 函数定义。
- 修改：`src/services/database.js`
  责任：补 `db.rpc()` 统一入口。
- 修改：`src/services/safeDb.js`
  责任：如批量操作走安全包装，则补 `safeDb.rpc()` 和错误提示。
- 修改：`src/services/db/dailyPlans.js`
  责任：统一 `day` 字段命名，修正 `create/listByDate` 的字段使用。

### Direction 状态与数据加载

- 修改：`src/views/direction/composables/useDirectionState.js`
  责任：增加缓存状态、版本号、必要 helper。
- 修改：`src/views/direction/composables/useDirectionFetch.js`
  责任：将全量 `fetchData` 改为分层加载，并维护兼容镜像。
- 修改：`src/views/direction/composables/useDirectionSelection.js`
  责任：切换为缓存感知，修复跨年月份偏移、归档日期计算、目标切换状态重置。

### Direction 业务逻辑

- 修改：`src/views/direction/composables/useDirectionGoals.js`
  责任：目标增删改在编辑前按需加载 `monthly_plans`，范围缩放依赖 DB 级联。
- 修改：`src/views/direction/composables/useDirectionBatch.js`
  责任：切换到 RPC 批量新增/删除，并刷新缓存镜像。
- 修改：`src/views/direction/composables/useDirectionTasks.js`
  责任：确认归档编辑后对 `dailyTasks` / `dailyPlansCache` 的同步策略。

### Direction 组件

- 修改：`src/views/direction/components/DirectionSidebar.vue`
  责任：目标范围/系统负载读取新数据源，文案改为“本月进度”。
- 修改：`src/views/direction/components/GoalRangePicker.vue`
  责任：继续通过 composable 获取偏移和 activePicker。
- 修改：`src/views/direction/components/MissionArchive.vue`
  责任：去掉无用 prop，确保依赖新的 `datesWithTasks`。
- 修改：`src/views/direction/components/ArchiveItem.vue`
  责任：统一单一保存入口，避免 `blur` 双提交。
- 修改：`src/views/direction/components/AddGoalModal.vue`
  责任：改用统一 `months` 常量。

---

## Task 1：补数据库边界，先把数据模型定稳

**Files:**
- Modify: `database/schema.sql`

- [ ] **Step 1: 为 `daily_plans` 增加唯一约束**

```sql
ALTER TABLE daily_plans
ADD CONSTRAINT uq_daily_plans_monthly_day UNIQUE (monthly_plan_id, day);
```

- [ ] **Step 2: 将 `daily_plans -> monthly_plans` 改成级联删除**

```sql
SELECT conname
FROM pg_constraint
WHERE conrelid = 'daily_plans'::regclass
  AND confrelid = 'monthly_plans'::regclass;

ALTER TABLE daily_plans
DROP CONSTRAINT IF EXISTS <existing_fk_name>;

ALTER TABLE daily_plans
ADD CONSTRAINT daily_plans_monthly_plan_id_fkey
FOREIGN KEY (monthly_plan_id)
REFERENCES monthly_plans(id)
ON DELETE CASCADE;
```

- [ ] **Step 3: 增加批量 upsert / delete RPC**

```sql
CREATE OR REPLACE FUNCTION batch_upsert_daily_plans(
  p_monthly_plan_id UUID,
  p_user_id UUID,
  p_items JSONB
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

- [ ] **Step 4: 手动检查 schema 与现有字段名一致**

Run: 打开 `database/schema.sql`，确认 `daily_plans` 的日期列统一为 `day`。  
Expected: 不再出现新增逻辑写 `date`、查询逻辑读 `day` 的混用。

- [ ] **Step 5: Commit**

```bash
git add database/schema.sql
git commit -m "feat: add direction data constraints and rpc"
```

---

## Task 2：补服务层能力，打通前端调用 RPC 的路径

**Files:**
- Modify: `src/services/database.js`
- Modify: `src/services/safeDb.js`
- Modify: `src/services/db/dailyPlans.js`

- [ ] **Step 1: 在 `database.js` 增加 `rpc` 入口**

```js
import client from '@/config/supabase'

export const db = {
  plans,
  plansCategory,
  monthlyPlans,
  dailyPlans,
  habits,
  tasks,
  summaries,
  dailyReportViews,
  rpc(name, params) {
    return client.rpc(name, params)
  }
}
```

- [ ] **Step 2: 如 Direction 继续使用 `safeDb`，则透传 `rpc`**

```js
export const safeDb = {
  plans: wrapTable('plans'),
  plansCategory: wrapTable('plansCategory'),
  monthlyPlans: wrapTable('monthlyPlans'),
  dailyPlans: wrapTable('dailyPlans'),
  habits: wrapTable('habits'),
  tasks: wrapTable('tasks'),
  summaries: wrapTable('summaries'),
  dailyReportViews: wrapTable('dailyReportViews'),
  async rpc(name, params) {
    try {
      return await db.rpc(name, params)
    } catch (e) {
      console.error(`[safeDb] rpc ${name} failed:`, e)
      const { toast } = useToast()
      toast.error('批量操作失败')
      throw e  // 让调用方感知失败，避免继续执行 loadDailyPlans
    }
  }
}
```

- [ ] **Step 3: 统一 `dailyPlans` 服务中的日期字段为 `day`**

```js
async create(plan) {
  return await supabase.create(plan)
},
async listByDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`

  return await supabase.query(q => q
    .select(`
      *,
      monthly_plans (
        id,
        task_time,
        duration,
        plans (
          id,
          task_time,
          duration
        )
      )
    `)
    .eq('day', dateStr)
  )
}
```

- [ ] **Step 4: 搜索仓库内 `dailyPlans.create` / `.eq('date'` 的调用点**

Run: `rg -n "dailyPlans\\.create|\\.eq\\('date'|dp\\.date|new Date\\(dp\\.date\\)" src database`  
Expected: 找出需要一并改成 `day` 的剩余位置，不留下半套命名。

- [ ] **Step 5: Commit**

```bash
git add src/services/database.js src/services/safeDb.js src/services/db/dailyPlans.js
git commit -m "feat: add rpc support and normalize daily plan date field"
```

---

## Task 3：重构 Direction 状态与加载链路，建立缓存主源

**Files:**
- Modify: `src/views/direction/composables/useDirectionState.js`
- Modify: `src/views/direction/composables/useDirectionFetch.js`

- [ ] **Step 1: 在 `useDirectionState.js` 增加缓存和 helper**

```js
export const monthlyPlans = ref([])
export const monthlyPlansCache = reactive({})
export const dailyPlansCache = reactive({})
export const archiveVersion = ref(0)

export const getMonthlyPlansByPlanId = (planId) => monthlyPlansCache[planId] || []
```

- [ ] **Step 2: 保留 `monthlyPlans` 为扁平兼容镜像**

```js
const syncMonthlyPlansToFlatList = (planId) => {
  const cached = monthlyPlansCache[planId] || []
  const others = monthlyPlans.value.filter(item => item.plan_id !== planId)
  monthlyPlans.value = [...others, ...cached]
}
```

- [ ] **Step 3: 将 `loadDailyPlans` 改为“写缓存 + 写兼容层”**

```js
const loadDailyPlans = async (monthlyPlanId, { force = false } = {}) => {
  if (!force && dailyPlansCache[monthlyPlanId]) return

  const dps = await db.dailyPlans.list(monthlyPlanId)
  dailyPlansCache[monthlyPlanId] = dps

  const mp = Object.values(monthlyPlansCache)
    .flat()
    .find(item => item.id === monthlyPlanId)
  if (!mp) return

  const month = new Date(mp.month).getMonth() + 1
  const prefix = `plan-${mp.plan_id}-${month}-`
  for (const key of Object.keys(dailyTasks)) {
    if (key.startsWith(prefix)) delete dailyTasks[key]
  }

  for (const dp of dps) {
    const day = new Date(dp.day).getDate()
    dailyTasks[`plan-${mp.plan_id}-${month}-${day}`] = dp
  }
}
```

- [ ] **Step 4: 把 `fetchData()` 拆成 `loadPlans / loadMonthlyPlans / loadDailyPlans`**

```js
const loadPlans = async () => {
  plans.value = await db.plans.list()
}

const loadMonthlyPlans = async (planId) => {
  if (monthlyPlansCache[planId]) return
  monthlyPlansCache[planId] = await db.monthlyPlans.list(planId)
  syncMonthlyPlansToFlatList(planId)
}
```

- [ ] **Step 5: 让 `categorizedGoals` 不再依赖月计划反推范围**

```js
map.get(categoryName).push({
  ...plan,
  name: plan.title,
  plan_id: plan.id,
  category_name: categoryName
})
```

- [ ] **Step 6: 手动检查首屏请求链**

Run: `pnpm dev`  
Expected: 首屏只加载 `plans`；选中目标时再拉 `monthly_plans`；展开月份时再拉 `daily_plans`。

- [ ] **Step 7: Commit**

```bash
git add src/views/direction/composables/useDirectionState.js src/views/direction/composables/useDirectionFetch.js
git commit -m "refactor: add direction layered caches"
```

---

## Task 4：重构选择与归档逻辑，消除跨年和刷新 hack

**Files:**
- Modify: `src/views/direction/composables/useDirectionSelection.js`
- Modify: `src/views/direction/components/MissionArchive.vue`
- Modify: `src/views/direction/components/GoalRangePicker.vue`
- Modify: `src/views/direction/components/MissionBoard.vue`

- [ ] **Step 1: 修复 `selectGoal` 为同步，异步加载由 watcher 接管**

```js
const selectGoal = (g) => {
  selectedGoal.value = g
  selectedMonth.value = null
  activePicker.value = 'start'
}
```

在 `MissionBoard.vue`（或 `index.vue`）中新增 watcher：

```js
import { watch } from 'vue'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

watch(selectedGoal, async (newGoal) => {
  if (newGoal) {
    await loadMonthlyPlans(newGoal.plan_id)
  }
})
```

- [ ] **Step 2: 将 `getMonthOffset()` 改成按目标年份计算**

```js
const getMonthOffset = (month) => {
  if (!selectedGoal.value) {
    return new Date(new Date().getFullYear(), month - 1, 1).getDay()
  }

  const cached = monthlyPlansCache[selectedGoal.value.plan_id] || []
  const mp = cached.find(item => new Date(item.month).getMonth() + 1 === month)
  if (!mp) {
    return new Date(new Date().getFullYear(), month - 1, 1).getDay()
  }

  const year = new Date(mp.month).getFullYear()
  return new Date(year, month - 1, 1).getDay()
}
```

- [ ] **Step 3: 将归档日期计算改为依赖缓存和 `archiveVersion`**

```js
const datesWithTasks = computed(() => {
  archiveVersion.value
  const planId = selectedGoal.value?.plan_id
  if (!planId || selectedMonth.value == null) return []

  const monthlyPlansOfGoal = monthlyPlansCache[planId] || []
  const mp = monthlyPlansOfGoal.find(
    item => new Date(item.month).getMonth() + 1 === selectedMonth.value
  )
  if (!mp) return []

  return (dailyPlansCache[mp.id] || [])
    .filter(dp => dp.title)
    .map(dp => new Date(dp.day).getDate())
    .sort((a, b) => a - b)
})
```

- [ ] **Step 4: 去掉 `MissionArchive.vue` 的无用 `months` prop**

```vue
<ArchiveHeader
  :month-name="selectedMonth ? months[selectedMonth - 1].full : '无内容'"
  :task-count="datesWithTasks.length"
  :selected-month="selectedMonth"
/>
```

- [ ] **Step 5: 在 `MissionBoard.vue` 中添加 `selectedGoal` 的 watcher**

```vue
<script setup>
import { watch } from 'vue'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'

const { loadMonthlyPlans } = useDirectionFetch()
const { selectedGoal } = useDirectionSelection()

watch(selectedGoal, async (newGoal) => {
  if (newGoal) {
    await loadMonthlyPlans(newGoal.plan_id)
  }
})
</script>
```

- [ ] **Step 6: 手动验证跨年目标和归档刷新**

Run: `pnpm dev`
Expected: 跨年目标月份空位正确；批量增删后归档立即刷新；不再需要 `setTimeout` 强刷。

- [ ] **Step 7: Commit**

```bash
git add src/views/direction/composables/useDirectionSelection.js src/views/direction/components/MissionArchive.vue src/views/direction/components/GoalRangePicker.vue src/views/direction/components/MissionBoard.vue
git commit -m "fix: align direction selection and archive with caches"
```

---

## Task 5：重构目标增删改，改为编辑前按需加载 + 级联删除

**Files:**
- Modify: `src/views/direction/composables/useDirectionGoals.js`
- Modify: `src/views/direction/components/AddGoalModal.vue`
- Modify: `src/views/direction/components/DirectionSidebar.vue`

- [ ] **Step 1: 新建目标时继续只创建 `plans` 与对应范围的 `monthly_plans`**

```js
const planData = {
  user_id: authStore.userId,
  title: newGoal.title,
  description: newGoal.description || '',
  year: `${year}-01-01`,
  category_id: newGoal.category_id || null,
  task_time: newGoal.task_time || '09:00',
  duration: newGoal.duration || 30,
  status: 'active',
  priority: 2,
}
```

- [ ] **Step 2: 编辑目标前按需加载该目标的 `monthly_plans`**

```js
const handleEditGoal = async (goal) => {
  if (!monthlyPlansCache[goal.plan_id]) {
    await loadMonthlyPlans(goal.plan_id)
  }
  const relatedMonthlyPlans = monthlyPlansCache[goal.plan_id] || []
  // 根据 relatedMonthlyPlans 计算 startMonth / endMonth
}
```

- [ ] **Step 3: 修改范围时继续通过 `monthly_plans` 增删来表达区间**

```js
const existingMonthlyPlans = monthlyPlansCache[planId] || []
const existingMonths = existingMonthlyPlans.map(mp => new Date(mp.month).getMonth() + 1)
// 按 startM/endM 计算 targetMonths，并增删对应 monthly_plans
```

- [ ] **Step 4: 删除目标时去掉逐条删 dailyPlans 的逻辑**

```js
const relatedMonthlyPlans = getMonthlyPlansByPlanId(planId)
await Promise.all(relatedMonthlyPlans.map(mp => db.monthlyPlans.delete(mp.id)))
await db.plans.delete(planId)
```

- [ ] **Step 5: Sidebar 进度读取缓存来源，范围不再要求首屏精确展示**

```js
const monthPlan = getMonthlyPlansByPlanId(planId).find(
  mp => new Date(mp.month).getMonth() + 1 === month
)
```

- [ ] **Step 6: 统一 `months` 常量来源**

```js
import { months } from '@/views/direction/composables/useDirectionState'
```

- [ ] **Step 7: 手动验证目标新增、编辑范围、删除**

Run: `pnpm dev`  
Expected: 新建目标会正确生成对应月份的 `monthly_plans`；编辑前会先补加载当前目标的 `monthly_plans`；缩小范围时相关日计划自动级联删除；删除目标不会留下孤儿记录。

- [ ] **Step 8: Commit**

```bash
git add src/views/direction/composables/useDirectionGoals.js src/views/direction/components/AddGoalModal.vue src/views/direction/components/DirectionSidebar.vue
git commit -m "refactor: load direction ranges from monthly plans"
```

---

## Task 6：切换批量操作到 RPC，并保证旧 UI 状态不回退

**Files:**
- Modify: `src/views/direction/composables/useDirectionBatch.js`
- Modify: `src/views/direction/components/MissionBoardMonthBody.vue`

- [ ] **Step 1: 将批量新增/修改改成一次 RPC**

```js
const applyBatchTask = async () => {
  const m = selectedMonth.value
  if (!m || !batchInput.value.trim()) return

  const cachedPlans = monthlyPlansCache[selectedGoal.value.plan_id] || []
  const currentMp = cachedPlans.find(mp => new Date(mp.month).getMonth() + 1 === m)
  if (!currentMp) return

  const year = new Date(currentMp.month).getFullYear()
  let daysToUpdate = selectedDates[m].filter(day => hasTask(m, day))
  if (daysToUpdate.length === 0) daysToUpdate = [...selectedDates[m]]

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
```

- [ ] **Step 2: 将批量删除改成一次 RPC**

```js
const handleBatchDelete = async () => {
  const m = selectedMonth.value
  if (!m || !selectedDates[m] || selectedDates[m].length === 0) return

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
  batchInput.value = ''
}
```

- [ ] **Step 3: 保持 `MissionBoardMonthBody.vue` 组件接口不变**

```vue
<Button class="batch-btn" @click="applyBatchTask">
  批量保存
</Button>
<Button class="batch-btn-danger" @click="handleBatchDelete">
  批量删除
</Button>
```

- [ ] **Step 4: 手动验证混选规则**

Run: `pnpm dev`  
Expected: 有任务日期和空白日期不能混选进入“修改”；纯空白日期仍可批量新建。

- [ ] **Step 5: Commit**

```bash
git add src/views/direction/composables/useDirectionBatch.js src/views/direction/components/MissionBoardMonthBody.vue
git commit -m "feat: switch direction batch actions to rpc"
```

---

## Task 7：修复归档编辑与最终回归

**Files:**
- Modify: `src/views/direction/components/ArchiveItem.vue`
- Modify: `src/views/direction/composables/useDirectionTasks.js`

- [ ] **Step 1: 去掉 `blur` 双提交路径，只保留单一入口**

```vue
<input
  class="archive-input"
  :value="task.title"
  @change="(e) => handleUpdateTask(task, { title: e.target.value })"
/>
```

- [ ] **Step 2: 确认 `handleUpdateTask` 更新后同步兼容层**

```js
// 调用方传入完整 task，handleUpdateTask 内部用 task.id 找 key 并更新
const handleUpdateTask = async (task, payload) => {
  if (!task.id) return
  await db.dailyPlans.update(task.id, {
    title: payload.title ?? task.title,
    task_time: payload.task_time ?? task.task_time,
    duration: payload.duration ?? task.duration
  })
  // 同步兼容层：遍历找 id 匹配项并更新
  for (const [k, v] of Object.entries(dailyTasks)) {
    if (v.id === task.id) {
      dailyTasks[k] = { ...v, ...payload }
      break
    }
  }
}
```

- [ ] **Step 3: 运行构建验证**

Run: `pnpm build`  
Expected: BUILD SUCCESS / 无 TypeScript 或 Vue 编译错误。

- [ ] **Step 4: 进行 Direction 手动回归**

Run: 手动测试 `/direction`  
Expected:
- 首屏只拉目标列表
- 选中目标才拉月计划
- 展开月份才拉日计划
- 月格子 dot、归档列表、批量操作三者状态一致
- 范围缩小后无孤儿日计划
- 文案显示为“本月进度”

- [ ] **Step 5: Commit**

```bash
git add src/views/direction/components/ArchiveItem.vue src/views/direction/composables/useDirectionTasks.js
git commit -m "fix: stabilize direction archive editing"
```

---

## Spec 覆盖检查

- 懒加载缓存：Task 3、Task 4、Task 5
- `monthlyPlans.value` / `dailyTasks` 兼容层：Task 3
- 目标范围按需推导：Task 3、Task 5
- RPC 批量操作：Task 1、Task 2、Task 6
- 级联删除：Task 1、Task 5
- 跨年月份偏移：Task 4
- 归档刷新与编辑：Task 4、Task 7
- 命名与无用 prop：Task 5、Task 4

## 计划备注

- 当前仓库没有看到现成的 Direction 自动化测试，执行时以 `pnpm build` + 手动回归为主。
- 这次不新增 `plans.start_month/end_month`，目标范围统一在需要时从 `monthly_plans` 推导。
- 如果要并行执行，推荐按 `Task 1+2`、`Task 3+4`、`Task 5+6+7` 三段分批推进，每段结束后做一次回归。
