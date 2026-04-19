# Day 页面 Daily Plans 不显示 Bug 修复设计

## 背景与目标

### 现象

`/day` 页面日计划（`daily_plans`）不显示。

### 当前已知结构

`daily_plans` 同时存在 `date` 与 `day` 两个日期列：

- `date DATE NOT NULL`（历史数据主要在此列）
- `day DATE`（部分流程写入，且存在大量 NULL）

应用层查询不一致：

- `listByDate()` 通过 `.eq('day', yyyy-mm-dd)` 过滤
- `list()` 仍按 `order('date')` 排序

### 本次目标

将 `daily_plans` 日期字段统一为单列 `day`，消除歧义，保证 `/day` 页面与 Direction 批处理链路稳定可用。

## 根因分析

问题并非单点查询错误，而是“同义双字段 + 读写不一致”：

1. 表结构中 `date` 与 `day` 同时存在。
2. 页面读取使用 `day`，但历史数据集中在 `date`。
3. 代码中仍残留 `date` 相关访问（如排序）。

## 设计决策

### 决策 1：保留字段名 `day` 作为唯一日期列

采用“清理重复字段并统一到 `day`”方案。最终表结构只保留：

- `day DATE NOT NULL`

### 决策 2：迁移策略采用“回填 + 删除旧列”

不直接删除 `date`，先做数据回填，避免数据丢失：

1. 将 `day IS NULL` 且 `date IS NOT NULL` 的记录回填到 `day`。
2. 校验不存在 `day IS NULL`。
3. 设置 `day NOT NULL`。
4. 删除 `date` 列。

### 决策 3：RPC 删除逻辑保持“按月内日号删除”

`batch_delete_daily_plans(p_days INT[])` 的入参语义是“每月第几天”，继续使用：

- `EXTRACT(DAY FROM day)::INT = ANY(p_days)`

本次不改为 `DATE[]`，避免联动改动与前端 payload 协议变更。

### 决策 4：迁移必须兼容“已执行过历史重命名”的环境

仓库中已有历史迁移 `supabase/migrations/20260209114939_update_schema.sql`，包含 `date -> day` 重命名逻辑。  
因此本次 SQL 必须幂等：无论环境当前是“仅 `date`”、“仅 `day`”还是“`date` + `day` 并存”，都能安全执行且不会重复失败。

## 页面影响评估

1. `/day`：直接受影响（高优先级验证）
   - 依赖 `db.dailyPlans.listByDate()` 按 `day` 查询。
   - 要求迁移后 `day` 不为空，否则仍会显示为空。

2. `/direction`：直接受影响（高优先级修复）
   - 依赖 `db.dailyPlans.list()` 拉取数据；该方法当前仍按 `order('date')` 排序，删列后会报错。
   - 需要同步改为 `order('day')`。
   - 批量写入仍通过 RPC 传 `item.date`，本次保持协议不变。

3. `/month`：不受本次字段迁移直接影响
   - 数据来自 `tasks` 表，不读 `daily_plans`。

4. `/year`：不受本次字段迁移直接影响
   - 数据来自 `habits/habit_logs`，不读 `daily_plans`。

5. `/summary`：不受本次字段迁移直接影响
   - 数据来自 `summaries/daily_summaries`，不读 `daily_plans`。

## 变更范围

### 数据库（Supabase）

1. 迁移 `daily_plans` 数据与结构：
   - 回填 `day`。
   - `ALTER COLUMN day SET NOT NULL`。
   - 删除 `date`。
2. 保留并验证约束/索引：
   - `uq_daily_plans_monthly_day (monthly_plan_id, day)`
   - `idx_daily_plans_day`
3. `batch_upsert_daily_plans` 继续向 `day` 写入，保持 `(item->>'date')::DATE` 的解析逻辑（API 输入字段名暂不变）。
4. `batch_delete_daily_plans` 保持现有删除条件。

### 应用层

1. `src/services/db/dailyPlans.js`
   - `list()` 的排序字段由 `date` 改为 `day`。
   - `listByDate()` 继续按 `day` 查询（无需改动）。
2. 全仓搜索并清理 `daily_plans` 上对 `date` 列的直接引用（若存在）。

### 种子数据与文档

1. `database/seed.sql`
   - `daily_plans` 的 INSERT 去除 `date` 列，只写 `day`。
2. `database/schema.sql`
   - `daily_plans` 定义移除 `date`，保留 `day DATE NOT NULL`。

## 迁移脚本（幂等、可重复执行）

```sql
-- 0) 如果只有 date 没有 day，先重命名（兼容旧环境）
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

-- 1) 当 date 与 day 并存时，回填 day
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

-- 2) day 设为非空（前提：已完成数据回填）
ALTER TABLE public.daily_plans
ALTER COLUMN day SET NOT NULL;

-- 3) 清理旧列 date（如果存在）
ALTER TABLE public.daily_plans
DROP COLUMN IF EXISTS date;

-- 4) 索引幂等收敛
DROP INDEX IF EXISTS public.idx_daily_plans_date;
CREATE INDEX IF NOT EXISTS idx_daily_plans_day ON public.daily_plans(day);

-- 5) 防御性校验（应返回 0）
SELECT COUNT(*) AS null_day_count
FROM public.daily_plans
WHERE day IS NULL;
```

## 验证方案

1. 数据验证
   - `SELECT COUNT(*) FROM daily_plans WHERE day IS NULL;` 结果为 `0`。
2. 功能验证
   - `/day` 页面可正确展示 daily plans。
   - Direction 批量保存后，`daily_plans.day` 有正确值。
   - Direction 批量删除按日期号删除行为与原逻辑一致。
3. 回归验证
   - 相关列表按 `day` 升序显示。
   - 不出现 `column "date" does not exist` 错误。
   - `/month`、`/year`、`/summary` 页面行为与迁移前一致。

## 回滚策略

若迁移后出现异常，使用以下紧急回滚（结构级）：

```sql
ALTER TABLE daily_plans ADD COLUMN IF NOT EXISTS date DATE;
UPDATE daily_plans SET date = day WHERE date IS NULL;
```

说明：回滚仅用于紧急恢复读写兼容，不恢复历史“重复字段”长期状态；问题定位后应重新执行统一方案。

## 非目标

1. 本次不调整 `batch_upsert_daily_plans` 入参 JSON 中 `date` 字段命名。
2. 本次不重构 Direction 领域模型或前端页面结构。
