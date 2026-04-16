# Day 页面 Daily Plans 不显示 Bug 修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一 `daily_plans` 日期字段为 `day` 并修复 `/day` 与 `/direction` 在该字段上的读取一致性，确保历史数据不丢失。

**Architecture:** 采用“数据库幂等迁移 + 应用层字段收敛 + 本地 schema/seed 同步”三段式落地。先通过幂等 SQL 兼容不同环境的历史状态（仅 `date`、仅 `day`、并存），再修复服务层对 `date` 的残留引用，最后用页面级回归验证确认无副作用。

**Tech Stack:** Supabase PostgreSQL, Vue 3, Vite, JavaScript

---

## 文件变更映射

| 文件 | 责任 |
|---|---|
| `supabase/migrations/20260416100000_unify_daily_plans_day.sql` | 生产迁移，幂等处理 `date/day` 收敛 |
| `database/schema.sql` | 本地 schema 基线同步为最终结构（仅 `day`） |
| `database/seed.sql` | 本地种子数据只写 `day` |
| `src/services/db/dailyPlans.js` | 修复 `list()` 的排序字段，避免删除 `date` 后报错 |

### Task 1: 新增 Supabase 幂等迁移脚本

**Files:**
- Create: `supabase/migrations/20260416100000_unify_daily_plans_day.sql`

- [ ] **Step 1: 创建迁移文件并写入幂等 SQL**

```sql
-- unify daily_plans date/day to single day column

-- 0) only-date environment: rename date -> day
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'date'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'day'
  ) THEN
    ALTER TABLE public.daily_plans RENAME COLUMN date TO day;
  END IF;
END $$;

-- 1) date+day coexist: backfill day from date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'date'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'day'
  ) THEN
    EXECUTE '
      UPDATE public.daily_plans
      SET day = date
      WHERE day IS NULL
        AND date IS NOT NULL
    ';
  END IF;
END $$;

-- 2) enforce final shape
ALTER TABLE public.daily_plans
ALTER COLUMN day SET NOT NULL;

ALTER TABLE public.daily_plans
DROP COLUMN IF EXISTS date;

-- 3) converge indexes
DROP INDEX IF EXISTS public.idx_daily_plans_date;
CREATE INDEX IF NOT EXISTS idx_daily_plans_day ON public.daily_plans(day);

-- 4) safety check
SELECT COUNT(*) AS null_day_count
FROM public.daily_plans
WHERE day IS NULL;
```

- [ ] **Step 2: 校验迁移文件已落盘且内容包含关键语句**

Run: `rg -n "RENAME COLUMN date TO day|DROP COLUMN IF EXISTS date|ALTER COLUMN day SET NOT NULL|idx_daily_plans_day" supabase/migrations/20260416100000_unify_daily_plans_day.sql`  
Expected: 输出至少 4 行匹配，分别对应重命名、删列、非空约束、索引收敛。

- [ ] **Step 3: 提交迁移文件**

```bash
git add supabase/migrations/20260416100000_unify_daily_plans_day.sql
git commit -m "feat(db): add idempotent migration to unify daily_plans day column"
```

### Task 2: 同步本地 schema 基线到最终结构

**Files:**
- Modify: `database/schema.sql`

- [ ] **Step 1: 调整 `daily_plans` 表定义，仅保留 `day DATE NOT NULL`**

```sql
-- before
date DATE NOT NULL,
day DATE,

-- after
day DATE NOT NULL,
```

- [ ] **Step 2: 删除/替换 `daily_plans` 上的旧 date 索引定义（如果存在）**

```sql
-- ensure final index state
CREATE INDEX idx_daily_plans_day ON daily_plans(day);
```

- [ ] **Step 3: 验证 schema 不再出现 `daily_plans.date`**

Run: `rg -n "daily_plans.*date|date DATE NOT NULL|idx_daily_plans_date" database/schema.sql`  
Expected: 无匹配（或仅注释/历史说明，不存在有效 DDL）。

- [ ] **Step 4: 提交 schema 变更**

```bash
git add database/schema.sql
git commit -m "chore(schema): align daily_plans schema to single day column"
```

### Task 3: 同步 seed 数据写入字段

**Files:**
- Modify: `database/seed.sql`

- [ ] **Step 1: 修改 daily_plans INSERT，去掉 `date` 列与其值**

```sql
-- before
INSERT INTO daily_plans (monthly_plan_id, user_id, title, description, status, priority, date, day)
VALUES
(..., '2026-02-09', '2026-02-09'),
(..., '2026-02-10', '2026-02-10');

-- after
INSERT INTO daily_plans (monthly_plan_id, user_id, title, description, status, priority, day)
VALUES
(..., '2026-02-09'),
(..., '2026-02-10');
```

- [ ] **Step 2: 校验 seed 不再引用 `daily_plans.date`**

Run: `rg -n "daily_plans .*date|\\(.*date, day\\)|, date\\)" database/seed.sql`  
Expected: 无匹配。

- [ ] **Step 3: 提交 seed 变更**

```bash
git add database/seed.sql
git commit -m "chore(seed): remove daily_plans date column usage"
```

### Task 4: 修复应用层 `dailyPlans` 查询字段

**Files:**
- Modify: `src/services/db/dailyPlans.js`

- [ ] **Step 1: 将 `list()` 的排序字段从 `date` 改为 `day`**

```js
// before
let query = q.select('*').order('date', { ascending: true })

// after
let query = q.select('*').order('day', { ascending: true })
```

- [ ] **Step 2: 保持 `listByDate()` 的 `.eq('day', dateStr)` 不变**

```js
// keep as-is
.eq('day', dateStr)
```

- [ ] **Step 3: 验证 `services` 层不存在 `daily_plans` 的 `date` 查询/排序残留**

Run: `rg -n "dailyPlans.*date|\\.order\\('date'" src/services`  
Expected: 不存在 `dailyPlans` 相关的 `date` 查询/排序残留。

- [ ] **Step 4: 提交应用层修复**

```bash
git add src/services/db/dailyPlans.js
git commit -m "fix(day): query daily_plans by day field only"
```

### Task 5: 执行迁移与页面回归验证

**Files:**
- Verify only (no required file edits)

- [ ] **Step 1: 在 Supabase 执行新迁移**

Run: `supabase db push`  
Expected: 迁移执行成功，无重复列/重复索引报错。

- [ ] **Step 2: 数据层校验**

```sql
SELECT COUNT(*) AS null_day_count
FROM public.daily_plans
WHERE day IS NULL;
```

Expected: `null_day_count = 0`

- [ ] **Step 3: 启动应用并验证核心页面**

Run: `pnpm dev`  
Expected: 本地服务启动成功，无构建错误。

手工验证：
1. 打开 `/day`，确认 daily plans 能展示。
2. 打开 `/direction`，确认列表加载无报错，批量新增/删除正常。
3. 打开 `/month`、`/year`、`/summary`，确认页面行为与迁移前一致。

- [ ] **Step 4: 捕获回归证据并提交**

```bash
git add .
git commit -m "test(regression): verify day/direction flows after daily_plans migration"
```
