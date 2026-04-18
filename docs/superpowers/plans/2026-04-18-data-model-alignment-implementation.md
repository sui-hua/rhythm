# 数据模型对齐实施计划

> **执行说明：** 如需按任务拆分执行，优先使用 `subagent-driven-development` 或 `executing-plans` 技能；所有步骤统一使用 `- [ ]` 复选框跟踪状态。

**目标：** 基于 Supabase MCP 查询到的线上真实库状态，优先完成 summaries 的第一阶段非破坏性结构改造，收敛 summary 模块、显式化年份路由，并把 Direction 首屏加载从串行改成并发。

**架构：** 以 Supabase MCP 作为数据库唯一真相源，只对仍未统一的 summary 模型做增量变更；仓库内不再维护本地 schema 或 migration 文件作为核心资产，只保留基于 MCP 的结构说明。随后收敛 summary 服务与 UI，最后处理年份路由和 Direction 数据流。每一块都通过小步 TDD 推进，避免一次改动跨越太多模块。

**技术栈：** Vue 3、Vue Router、Pinia、Supabase MCP、Vitest

**提交策略：** 遵循仓库规则，本计划执行过程中不做 `git commit`，由用户在完整功能闭环完成后统一提交。

---

## 文件结构映射

### 数据库说明与远程变更

- 修改：`database/README.md`
- 修改：`database/current-structure.md`
- 责任：记录 MCP 查询到的真实结构，并以 MCP 直接执行数据库变更

### 总结服务与适配

- 修改：`src/services/db/summaries.js`
- 新增：`src/views/summary/utils/summaryAdapters.js`
- 新增：`src/views/summary/utils/summaryPeriods.js`
- 新增：`src/views/summary/utils/summaryRouteHelpers.js`
- 新增：`src/views/summary/composables/__tests__/summaryAdapters.spec.js`
- 责任：统一 `SummaryRecord`、隔离数据库记录与表单模型转换

### 总结页面

- 修改：`src/views/summary/composables/useSummaryManager.js`
- 修改：`src/views/summary/composables/useSummarySidebar.js`
- 修改：`src/views/summary/composables/useDailySummaryForm.js`
- 修改：`src/views/summary/composables/useGenericSummaryForm.js`
- 修改：`src/views/summary/components/SummarySidebar.vue`
- 修改：`src/views/summary/components/DailySummaryForm.vue`
- 修改：`src/views/summary/components/GenericSummaryForm.vue`
- 新增：`src/views/summary/composables/__tests__/useSummarySidebar.spec.js`
- 责任：让 summary 页彻底消费统一 `SummaryRecord`

### 年份路由

- 修改：`src/router/index.js`
- 修改：`src/components/Navbar.vue`
- 修改：`src/views/day/composables/useDayData.js`
- 修改：`src/views/day/composables/useDayNavigation.js`
- 修改：`src/views/month/composables/useMonthView.js`
- 修改：`src/views/year/composables/useYearView.js`
- 新增：`src/views/day/utils/routeDateContext.js`
- 新增：`src/views/day/composables/__tests__/routeDateContext.spec.js`
- 修改：`AGENTS.md`
- 修改：`CLAUDE.md`
- 修改：`docs/superpowers/specs/2026-04-15-global-loading-design.md`
- 责任：让 URL 成为年/月/日上下文的第一真相源

### Direction 首屏加载

- 修改：`src/views/direction/composables/useDirectionFetch.js`
- 新增：`src/views/direction/composables/__tests__/useDirectionFetch.spec.js`
- 责任：把串行 N+1 首屏请求改为并发实现

## Task 1：通过 Supabase MCP 执行 summaries 第一阶段非破坏性结构改造

**Files:**
- 修改：`database/README.md`
- 修改：`database/current-structure.md`
- Test：Supabase MCP 表结构校验 + SQL 执行验证

- [ ] **Step 1: 先记录 Supabase 线上真实表结构现状**

先把 MCP 已确认的现状写入任务备注，作为迁移依据：

```text
线上已存在：
- plans.task_time / duration
- monthly_plans.task_time / duration
- daily_plans.task_time / duration
- habits.is_archived / archived / task_time / duration
- habit_logs.user_id
- tasks.actual_start_time / actual_end_time

线上仍未统一：
- summaries 仍是 scope + content(text)
- daily_summaries 仍是旧结构
```

- [ ] **Step 2: 整理第一阶段要通过 MCP 直接执行的 SQL**

先整理执行 SQL：

```sql
BEGIN;

ALTER TABLE summaries
ADD COLUMN IF NOT EXISTS kind TEXT,
ADD COLUMN IF NOT EXISTS period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE summaries
ALTER COLUMN content TYPE JSONB
USING jsonb_build_object('text', COALESCE(content, ''));
UPDATE summaries
SET
  kind = CASE scope
    WHEN 'week' THEN 'weekly'
    WHEN 'month' THEN 'monthly'
    WHEN 'year' THEN 'yearly'
    ELSE NULL
  END,
  period_start = CASE scope
    WHEN 'week' THEN date_trunc('week', created_at)
    WHEN 'month' THEN date_trunc('month', created_at)
    WHEN 'year' THEN date_trunc('year', created_at)
    ELSE NULL
  END,
  period_end = CASE scope
    WHEN 'week' THEN date_trunc('week', created_at) + INTERVAL '6 days 23 hours 59 minutes 59 seconds'
    WHEN 'month' THEN date_trunc('month', created_at) + INTERVAL '1 month - 1 second'
    WHEN 'year' THEN date_trunc('year', created_at) + INTERVAL '1 year - 1 second'
    ELSE NULL
  END,
  updated_at = COALESCE(updated_at, created_at, NOW())
WHERE kind IS NULL;

INSERT INTO summaries (
  user_id,
  kind,
  period_start,
  period_end,
  title,
  content,
  mood,
  created_at,
  updated_at
)
SELECT
  user_id,
  'daily',
  date_trunc('day', created_at),
  date_trunc('day', created_at) + INTERVAL '1 day' - INTERVAL '1 second',
  NULL,
  jsonb_build_object(
    'done', COALESCE(today_did, ''),
    'improve', COALESCE(today_issue, ''),
    'tomorrow', COALESCE(tomorrow_fix, '')
  ),
  mood,
  created_at,
  NOW()
FROM daily_summaries ds
WHERE NOT EXISTS (
  SELECT 1
  FROM summaries s
  WHERE s.user_id = ds.user_id
    AND s.kind = 'daily'
    AND s.period_start = date_trunc('day', ds.created_at)
);

COMMIT;
```

本阶段明确**不做**：

```text
1. 不删除 daily_summaries
2. 不删除 summaries.scope
3. 不删除任何旧索引、旧策略或旧字段
4. 不做依赖前端已切换完成的清理动作
```

- [ ] **Step 3: 通过 Supabase MCP 直接执行上述 SQL**

Run:

```text
execute_sql:
- query: 使用上面整理好的 SQL
```

Expected:

- SQL 执行成功
- 不影响现有 `plans / monthly_plans / daily_plans / habits / tasks`
- 旧 summary 读写路径在短期内仍保留回退空间

- [ ] **Step 4: 用 Supabase MCP 验证迁移结果**

验证项：

```text
1. list_tables(verbose=true) 检查 summaries 是否已有：
   - kind
   - period_start
   - period_end
   - updated_at
   - content = jsonb

2. execute_sql:
   SELECT COUNT(*) FROM daily_summaries;
   SELECT COUNT(*) FROM summaries;
```

Expected:

- `summaries` 新列已生效
- 由于线上两张总结表当前都是空表，迁移不会产生脏数据
- `daily_summaries` 与 `summaries.scope` 仍然保留，未做破坏性删除

- [ ] **Step 4.5: 在任务备注里写清楚第二阶段不属于本轮执行范围**

明确记录：

```text
第二阶段才考虑：
- 前端完全切到新 summaries 模型
- 观察线上稳定性
- 再决定是否删除 daily_summaries
- 再决定是否删除 summaries.scope
```

- [ ] **Step 5: 更新 `database/current-structure.md` 中 summaries 说明**

把 `summaries` 更新为：

```md
### `public.summaries`

主要字段：

- `id`
- `user_id`
- `kind`
- `period_start`
- `period_end`
- `title`
- `content`
- `mood`
- `created_at`
- `updated_at`
```

- [ ] **Step 6: 更新 `database/README.md` 的工作流说明**

确保文档明确写出：

```md
1. 数据库结构以 Supabase MCP 为准
2. 数据库变更通过 Supabase MCP 直接执行
3. 本地不再维护 `schema.sql`
4. 本地不再依赖 `supabase/` 目录
```

## Task 2：统一 summary 适配层与服务层

**Files:**
- 新增：`src/views/summary/utils/summaryAdapters.js`
- 新增：`src/views/summary/utils/summaryPeriods.js`
- 新增：`src/views/summary/utils/summaryRouteHelpers.js`
- 修改：`src/services/db/summaries.js`
- Test：`src/views/summary/composables/__tests__/summaryAdapters.spec.js`

- [ ] **Step 1: 先写 summary adapter 的失败测试**

在 `src/views/summary/composables/__tests__/summaryAdapters.spec.js` 里写：

```js
import { describe, expect, it } from 'vitest'
import {
  mapSummaryRowToRecord,
  buildSummaryPayload
} from '@/views/summary/utils/summaryAdapters'

describe('summaryAdapters', () => {
  it('把 daily row 映射成统一 SummaryRecord', () => {
    const record = mapSummaryRowToRecord({
      id: '1',
      user_id: 'u1',
      kind: 'daily',
      period_start: '2026-04-18T00:00:00.000Z',
      period_end: '2026-04-18T23:59:59.000Z',
      title: null,
      content: { done: '完成任务', improve: '少刷手机', tomorrow: '继续推进' },
      mood: 4,
      created_at: '2026-04-18T12:00:00.000Z',
      updated_at: '2026-04-18T12:00:00.000Z'
    })

    expect(record.kind).toBe('daily')
    expect(record.content.done).toBe('完成任务')
  })

  it('把周期总结表单数据转换成统一 payload', () => {
    const payload = buildSummaryPayload({
      kind: 'monthly',
      userId: 'u1',
      period: {
        periodStart: '2026-04-01T00:00:00.000Z',
        periodEnd: '2026-04-30T23:59:59.000Z'
      },
      formData: {
        title: '四月复盘',
        text: '本月整体推进稳定',
        mood: 5
      }
    })

    expect(payload.kind).toBe('monthly')
    expect(payload.content).toEqual({ text: '本月整体推进稳定' })
  })
})
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run:

```bash
pnpm test:unit -- summaryAdapters
```

Expected:

- FAIL，提示找不到 `summaryAdapters` 或导出函数不存在

- [ ] **Step 3: 实现 `summaryPeriods.js` 的默认周期生成**

新增：

```js
export const buildDefaultPeriod = (kind, anchorDate = new Date()) => {
  const base = new Date(anchorDate)

  if (kind === 'daily') {
    return {
      periodStart: new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0).toISOString(),
      periodEnd: new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59).toISOString()
    }
  }

  if (kind === 'monthly') {
    return {
      periodStart: new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0).toISOString(),
      periodEnd: new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59).toISOString()
    }
  }

  if (kind === 'yearly') {
    return {
      periodStart: new Date(base.getFullYear(), 0, 1, 0, 0, 0).toISOString(),
      periodEnd: new Date(base.getFullYear(), 11, 31, 23, 59, 59).toISOString()
    }
  }

  const day = base.getDay() || 7
  const monday = new Date(base)
  monday.setDate(base.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    periodStart: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0).toISOString(),
    periodEnd: new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59).toISOString()
  }
}
```

- [ ] **Step 4: 实现 `summaryAdapters.js`**

新增：

```js
export const mapSummaryRowToRecord = (row) => ({
  id: row.id,
  user_id: row.user_id,
  kind: row.kind,
  period_start: row.period_start,
  period_end: row.period_end,
  title: row.title ?? null,
  content: typeof row.content === 'string' ? { text: row.content } : (row.content || {}),
  mood: row.mood ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at ?? row.created_at
})

export const buildSummaryPayload = ({ kind, userId, period, formData, existingRecord }) => ({
  id: existingRecord?.id,
  user_id: userId,
  kind,
  period_start: period.periodStart,
  period_end: period.periodEnd,
  title: kind === 'daily' ? null : (formData.title?.trim() || null),
  content: kind === 'daily'
    ? {
        done: formData.done || '',
        improve: formData.improve || '',
        tomorrow: formData.tomorrow || ''
      }
    : {
        text: formData.text || ''
      },
  mood: formData.mood ?? null
})
```

- [ ] **Step 5: 新增 `summaryRouteHelpers.js`，统一 kind 与 tab 映射**

新增：

```js
export const summaryTabToKind = (tabId) => {
  if (tabId === 'day') return 'daily'
  if (tabId === 'week') return 'weekly'
  if (tabId === 'month') return 'monthly'
  if (tabId === 'year') return 'yearly'
  return 'daily'
}

export const summaryKindToTab = (kind) => {
  if (kind === 'daily') return 'day'
  if (kind === 'weekly') return 'week'
  if (kind === 'monthly') return 'month'
  if (kind === 'yearly') return 'year'
  return 'day'
}
```

- [ ] **Step 6: 重写 `src/services/db/summaries.js`**

目标代码：

```js
import client from '@/config/supabase'
import { trackGlobalLoading } from '@/composables/useGlobalLoading'
import { mapSummaryRowToRecord } from '@/views/summary/utils/summaryAdapters'

const table = 'summaries'

export const summaries = {
  async listByKind(kind) {
    return await trackGlobalLoading(async () => {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('kind', kind)
        .order('period_start', { ascending: false })

      if (error) throw error
      return (data || []).map(mapSummaryRowToRecord)
    })
  },

  async save(payload) {
    return await trackGlobalLoading(async () => {
      const query = payload.id
        ? client.from(table).update(payload).eq('id', payload.id)
        : client.from(table).insert(payload)

      const { data, error } = await query.select().single()
      if (error) throw error
      return mapSummaryRowToRecord(data)
    })
  },

  async remove(id) {
    return await trackGlobalLoading(async () => {
      const { error } = await client.from(table).delete().eq('id', id)
      if (error) throw error
    })
  }
}
```

- [ ] **Step 7: 运行测试确认 adapter/service 基础通过**

Run:

```bash
pnpm test:unit -- summaryAdapters
```

Expected:

- PASS，两个 adapter 用例通过

## Task 3：让 summary 页面统一消费 SummaryRecord

**Files:**
- 修改：`src/views/summary/composables/useSummaryManager.js`
- 修改：`src/views/summary/composables/useSummarySidebar.js`
- 修改：`src/views/summary/composables/useDailySummaryForm.js`
- 修改：`src/views/summary/composables/useGenericSummaryForm.js`
- 修改：`src/views/summary/components/SummarySidebar.vue`
- Test：`src/views/summary/composables/__tests__/useSummarySidebar.spec.js`

- [ ] **Step 1: 先写 summary sidebar 失败测试**

新增测试：

```js
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useSummarySidebar } from '@/views/summary/composables/useSummarySidebar'

describe('useSummarySidebar', () => {
  it('按 daily 记录返回 done 摘要', () => {
    const { getSummaryTitle } = useSummarySidebar(ref('daily'))
    expect(getSummaryTitle({
      title: null,
      content: { done: '今天完成了 schema 对齐' }
    })).toBe('今天完成了 schema 对齐')
  })

  it('按 monthly 记录返回 title 优先', () => {
    const { getSummaryTitle } = useSummarySidebar(ref('monthly'))
    expect(getSummaryTitle({
      title: '四月复盘',
      content: { text: '备用摘要' }
    })).toBe('四月复盘')
  })
})
```

- [ ] **Step 2: 运行测试确认当前失败**

Run:

```bash
pnpm test:unit -- useSummarySidebar
```

Expected:

- FAIL，因为当前实现仍依赖 `summary.content.substring` 和 `summary.date`

- [ ] **Step 3: 改造 `useSummarySidebar.js`**

将核心逻辑改成：

```js
const kindTabs = [
  { id: 'daily', label: '日总结' },
  { id: 'weekly', label: '周总结' },
  { id: 'monthly', label: '月总结' },
  { id: 'yearly', label: '年总结' }
]

const formatDate = (summary) => {
  const start = new Date(summary.period_start)
  const end = new Date(summary.period_end)

  if (summary.kind === 'yearly') return `${start.getFullYear()}年`
  if (summary.kind === 'monthly') return `${start.getFullYear()}年${start.getMonth() + 1}月`
  if (summary.kind === 'weekly') return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
  return `${start.getMonth() + 1}月${start.getDate()}日`
}

const getSummaryTitle = (summary) => {
  if (summary.kind === 'daily') {
    return summary.content?.done || '暂无可编辑内容'
  }

  return summary.title || summary.content?.text || '暂无标题'
}
```

- [ ] **Step 4: 改造 `useSummaryManager.js`**

把 tab、service 调用和保存逻辑统一：

```js
import { summaryTabToKind } from '@/views/summary/utils/summaryRouteHelpers'

const activeTab = ref('day')

const loadSummaries = async () => {
  loading.value = true
  try {
    summaries.value = await db.summaries.listByKind(summaryTabToKind(activeTab.value))
  } finally {
    loading.value = false
  }
}

const handleSave = async (formData) => {
  const kind = summaryTabToKind(activeTab.value)
  const period = buildDefaultPeriod(kind)
  const payload = buildSummaryPayload({
    kind,
    userId: authStore.userId,
    period,
    formData,
    existingRecord: selectedSummary.value
  })

  await db.summaries.save(payload)
  await loadSummaries()
}
```

- [ ] **Step 5: 改造两个 form composable**

`useDailySummaryForm.js`：

```js
const formData = ref({
  done: '',
  improve: '',
  tomorrow: '',
  mood: null
})

const buildPayload = () => ({
  done: formData.value.done,
  improve: formData.value.improve,
  tomorrow: formData.value.tomorrow,
  mood: formData.value.mood ?? null
})
```

`useGenericSummaryForm.js`：

```js
const title = ref('')
const buildPayload = () => ({
  title: title.value,
  text: content.value,
  mood: mood.value ?? null
})
```

同时在 `watch` 中从 `initialData.content.text` 或 `initialData.content.done` 取值，而不是直接假设 `content` 是字符串。

- [ ] **Step 6: 改造 `DailySummaryForm.vue`，把 mood 输入补进 UI**

模板改成：

```vue
<div class="grid gap-2">
  <label class="text-sm font-medium leading-none">今日心情</label>
  <input
    v-model.number="formData.mood"
    type="number"
    min="1"
    max="5"
    class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
  />
</div>
```

要求：

1. 继续保留 `done / improve / tomorrow`
2. 新增 `mood`
3. 提交时通过 `buildPayload()` 一起发出

- [ ] **Step 7: 改造 `GenericSummaryForm.vue`，把 title / mood 输入补进 UI**

模板改成：

```vue
<div class="grid gap-2">
  <label class="text-sm font-medium leading-none">
    {{ typeName }}总结标题
  </label>
  <input
    v-model="title"
    type="text"
    class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
    placeholder="输入标题（可选）"
  />
</div>

<div class="grid gap-2">
  <label class="text-sm font-medium leading-none">
    {{ typeName }}心情
  </label>
  <input
    v-model.number="mood"
    type="number"
    min="1"
    max="5"
    class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
  />
</div>
```

要求：

1. 页面上真实可输入 `title`
2. 页面上真实可输入 `mood`
3. 与 composable 中的 `title / content / mood` 保持一致

- [ ] **Step 8: 改造 `SummarySidebar.vue`，修正 `formatDate` 调用签名**

当前组件仍是：

```vue
{{ formatDate(summary.date, activeTab) }}
```

改成：

```vue
{{ formatDate(summary) }}
```

同时保持：

```vue
{{ getSummaryTitle(summary) }}
```

- [ ] **Step 9: 运行 summary 相关测试**

Run:

```bash
pnpm test:unit -- useSummarySidebar
```

Expected:

- PASS，summary 标题与日期规则符合统一模型

## Task 4：把年份提升为路由真相源

**Files:**
- 修改：`src/router/index.js`
- 修改：`src/components/Navbar.vue`
- 修改：`src/views/day/composables/useDayData.js`
- 修改：`src/views/day/composables/useDayNavigation.js`
- 修改：`src/views/month/composables/useMonthView.js`
- 修改：`src/views/year/composables/useYearView.js`
- 新增：`src/views/day/utils/routeDateContext.js`
- Test：`src/views/day/composables/__tests__/routeDateContext.spec.js`

- [ ] **Step 0: 先按仓库现状列出所有需要同步修改的调用点**

本次把路由参数从 `monthIndex` 收敛成 `month`，实际需要同步修改的地方至少包括：

```text
运行时代码：
1. src/router/index.js
   - /month/:monthIndex
   - /day/:monthIndex/:day

2. src/components/Navbar.vue
   - route.params.monthIndex
   - monthPath 拼接
   - currentDate 构造

3. src/views/month/composables/useMonthView.js
   - monthIndexFromRoute
   - route.params.monthIndex
   - watch(route.params.monthIndex)

4. src/views/day/composables/useDayData.js
   - route.params.monthIndex

5. src/views/day/composables/useDayNavigation.js
   - route.params.monthIndex
   - 校验逻辑
   - dateStore.setYearMonthDay(year, monthIndex - 1, day)
   - watch([route.params.monthIndex, route.params.day])

6. src/views/year/composables/useYearView.js
   - 与 buildMonthPath / buildDayPath 的调用保持一致

新增辅助层：
7. src/views/day/utils/routeDateContext.js
   - getRouteDateContext 返回值统一使用 month
   - buildMonthPath(year, month)

8. src/views/day/composables/__tests__/routeDateContext.spec.js
   - monthIndex 测试入参和断言全部改成 month

文档同步：
9. AGENTS.md
10. CLAUDE.md
11. docs/superpowers/specs/2026-04-15-global-loading-design.md
12. docs/superpowers/specs/2026-04-18-data-model-alignment-design.md
13. docs/superpowers/plans/2026-04-18-data-model-alignment-implementation.md
```

注意：

```text
1. 路由参数名改成 month，但业务语义仍然是自然月 1-12
2. 只有在 new Date(...) / setYearMonthDay(...) 时才转换成 JS 需要的 0-11
3. 不允许出现一半 month 一半 monthIndex 的过渡命名
```

- [ ] **Step 1: 先抽出纯函数 `routeDateContext.js`**

新增：

```js
export const getRouteDateContext = (params, fallback = new Date()) => {
  const year = Number(params.year || fallback.getFullYear())
  const month = Number(params.month || (fallback.getMonth() + 1))
  const day = Number(params.day || fallback.getDate())

  return {
    year,
    month,
    day,
    date: new Date(year, month - 1, day)
  }
}

export const buildDayPath = (date) => {
  return `/day/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

export const buildMonthPath = (year, month) => `/month/${year}/${month}`
export const buildYearPath = (year) => `/year/${year}`
```

- [ ] **Step 2: 先写路由日期上下文失败测试**

新增测试：

```js
import { describe, expect, it } from 'vitest'
import {
  getRouteDateContext,
  buildDayPath,
  buildMonthPath
} from '@/views/day/utils/routeDateContext'

describe('route date context', () => {
  it('从完整 year/month/day 路由解析目标日期', () => {
    const context = getRouteDateContext({
      year: '2027',
      month: '1',
      day: '1'
    })

    expect(context.year).toBe(2027)
    expect(context.month).toBe(1)
    expect(context.day).toBe(1)
    expect(context.date.getFullYear()).toBe(2027)
    expect(context.date.getMonth()).toBe(0)
    expect(context.date.getDate()).toBe(1)
  })

  it('能正确生成跨年日期路由', () => {
    const date = new Date(2027, 0, 1)
    expect(buildDayPath(date)).toBe('/day/2027/1/1')
    expect(buildMonthPath(2027, 1)).toBe('/month/2027/1')
  })
})
```

- [ ] **Step 3: 运行测试，确认当前失败**

Run:

```bash
pnpm test:unit -- routeDateContext
```

Expected:

- FAIL，因为 `routeDateContext.js` 还不存在或导出函数未实现

- [ ] **Step 4: 改 `src/router/index.js`**

路由改成：

```js
{
  path: '/month/:year/:month',
  name: 'MonthView',
  component: MonthView,
  props: true
},
{
  path: '/day/:year/:month/:day',
  name: 'DayView',
  component: DayView,
  props: true
},
{
  path: '/day',
  redirect: () => {
    const now = new Date()
    return buildDayPath(now)
  }
},
{
  path: '/year/:year',
  name: 'YearView',
  component: YearView,
  props: true
}
```

- [ ] **Step 5: 改 `Navbar.vue`**

上下文路由改成基于完整日期：

```js
import {
  getRouteDateContext,
  buildDayPath,
  buildMonthPath
} from '@/views/day/utils/routeDateContext'

const { year: currentYear, month, day } = getRouteDateContext(route.params)
const currentDate = new Date(currentYear, month - 1, day)

const prevDayPath = buildDayPath(prevDate)
const nextDayPath = buildDayPath(nextDate)

return {
  title: getMonthName(month, 'en'),
  monthPath: buildMonthPath(currentYear, month),
  prevDayPath,
  nextDayPath,
  show: true,
  mode: 'day'
}
```

- [ ] **Step 6: 改 `useDayData.js` 与 `useDayNavigation.js`**

核心逻辑改成以 `route.params.year` 为真相源：

```js
import { getRouteDateContext } from '@/views/day/utils/routeDateContext'

const routeDateContext = computed(() => getRouteDateContext(route.params))
const startOfDay = new Date(routeDateContext.value.year, month, day, 0, 0, 0)
const endOfDay = new Date(routeDateContext.value.year, month, day, 23, 59, 59)
```

`syncDateWithRoute()` 改为：

```js
const year = parseInt(route.params.year)
dateStore.setYearMonthDay(year, month - 1, day)
```

- [ ] **Step 7: 改 `useMonthView.js` 与 `useYearView.js`**

月视图：

```js
import { buildDayPath, buildMonthPath } from '@/views/day/utils/routeDateContext'

const yearFromRoute = computed(() => parseInt(route.params.year))
const currentYear = yearFromRoute.value
router.push(buildDayPath(new Date(currentYear, selectedMonth.value.index, date)))
```

年视图：

```js
const routeYear = computed(() => parseInt(route.params.year) || new Date().getFullYear())
router.push(buildMonthPath(routeYear.value, month.index + 1))
```

- [ ] **Step 8: 运行路由相关验证**

Run:

```bash
pnpm test:unit -- routeDateContext
```

Expected:

- PASS

再手动检查：

```bash
rg -n "/month/|/day/" src/components/Navbar.vue src/views/month src/views/day src/views/year src/router/index.js
```

Expected:

- 新链接统一包含 `:year`

## Task 5：把 Direction 首屏请求改成并发

**Files:**
- 修改：`src/views/direction/composables/useDirectionFetch.js`
- Test：`src/views/direction/composables/__tests__/useDirectionFetch.spec.js`

- [ ] **Step 1: 先写并发化目标测试**

新增测试：

```js
import { describe, expect, it, vi } from 'vitest'

describe('useDirectionFetch', () => {
  it('并发拉取 monthly plans 与 daily plans', async () => {
    const listMonthly = vi.fn().mockResolvedValue([{ id: 'mp1', plan_id: 'p1', month: '2026-04-01' }])
    const listDaily = vi.fn().mockResolvedValue([{ id: 'dp1', monthly_plan_id: 'mp1', day: '2026-04-18' }])

    await Promise.all([
      listMonthly('p1'),
      listMonthly('p2')
    ])

    await Promise.all([
      listDaily('mp1'),
      listDaily('mp2')
    ])

    expect(listMonthly).toHaveBeenCalledTimes(2)
    expect(listDaily).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: 运行测试确认基线**

Run:

```bash
pnpm test:unit -- useDirectionFetch
```

Expected:

- PASS 测试基线成立，但实现仍未并发化

- [ ] **Step 3: 改 `fetchData()` 的 monthly plan 拉取方式**

将：

```js
const allMonthlyPlans = []
for (const plan of plans.value) {
  const mps = await db.monthlyPlans.list(plan.id)
  allMonthlyPlans.push(...mps)
}
```

改成：

```js
const monthlyPlanGroups = await Promise.all(
  plans.value.map(plan => db.monthlyPlans.list(plan.id))
)
const allMonthlyPlans = monthlyPlanGroups.flat()
monthlyPlans.value = allMonthlyPlans
```

- [ ] **Step 4: 改 daily plan 拉取方式**

将：

```js
const allDailyPlans = []
for (const mp of monthlyPlans.value) {
  mpMap.set(mp.id, mp)
  const dps = await db.dailyPlans.list(mp.id)
  allDailyPlans.push(...dps)
}
```

改成：

```js
monthlyPlans.value.forEach(mp => {
  mpMap.set(mp.id, mp)
})

const dailyPlanGroups = await Promise.all(
  monthlyPlans.value.map(mp => db.dailyPlans.list(mp.id))
)
const allDailyPlans = dailyPlanGroups.flat()
```

- [ ] **Step 5: 运行 Direction 相关验证**

Run:

```bash
pnpm test:unit -- useDirectionFetch
```

Expected:

- PASS

再用代码搜索确认不再存在串行 `await db.monthlyPlans.list` / `await db.dailyPlans.list` 循环：

```bash
rg -n "for \\(const .*await db\\.(monthlyPlans|dailyPlans)\\.list" src/views/direction/composables/useDirectionFetch.js
```

Expected:

- 无匹配结果

## Task 6：整体验证与文档同步

**Files:**
- 修改：`README.md`（仅在路由说明或 summary 模型说明需要同步时）
- 修改：`docs/superpowers/specs/2026-04-18-data-model-alignment-design.md`（仅在实现偏差需要回写时）

- [ ] **Step 1: 运行现有单测集合**

Run:

```bash
pnpm test:unit
```

Expected:

- PASS

如果失败，优先修复本次改动波及的测试，再重新运行。

- [ ] **Step 2: 搜索旧 summary 双表调用残留**

Run:

```bash
rg -n "daily_summaries|listDaily|getDaily|saveDaily|deleteDaily|scope: 'day'|scope: \"day\"" src
```

Expected:

- 没有运行时代码继续直接依赖旧 `daily_summaries`

- [ ] **Step 3: 搜索旧无年份路由残留**

Run:

```bash
rg -n "/month/\\$|/month/\\$\\{|/month/[0-9]|/day/\\$|/day/\\$\\{|/day/[0-9]" src
```

Expected:

- 所有 month/day 链接都带 year

- [ ] **Step 4: 如果 README 有路由说明，同步为新路由**

目标文案：

```md
| `/direction` | Direction | 长期目标管理，三级级联：plans → monthly_plans → daily_plans |
| `/habits` | Habits | 周期行为追踪，热力图日历 + 数据统计 |
| `/day/:year/:month/:day` | Timeline | 每日时间轴，统一聚合 Task、DailyPlan、Habit |
| `/month/:year/:month` | Month | 月度视图 |
| `/year/:year` | Year | 年度总览 |
| `/summary` | Summary | 日/周/月/年总结 |
```

- [ ] **Step 5: 手动验收清单**

手动检查以下闭环：

1. 日总结可新增、编辑、刷新后仍正确显示
2. 月总结列表标题与日期正确
3. 从 12 月 31 日切到下一天会进入下一年 1 月 1 日
4. Direction 首屏仍能正常展示计划树

## 自检结果

### Spec 覆盖

已覆盖：

1. 先按 Supabase MCP 线上真实状态执行变更
2. Summary 单表模型
3. 年份路由真相源
4. Direction 并发化
5. 迁移、错误处理、验证策略

### 占位检查

已移除：

1. “后续再补”
2. “适当处理错误”
3. “写测试”这类无内容步骤

### 类型与命名一致性

统一命名：

1. summary tab / kind 使用 `daily`、`weekly`、`monthly`、`yearly`
2. 统一使用 `period_start` / `period_end`
3. 统一使用 `SummaryRecord`

Plan complete and saved to `docs/superpowers/plans/2026-04-18-data-model-alignment-implementation.md`. Two execution options:

1. Subagent-Driven (recommended) - 我派发独立子代理逐任务执行，并在任务间复核
2. Inline Execution - 我在当前会话里按计划顺序执行并在关键点停下来汇报

请选择一种执行方式。
