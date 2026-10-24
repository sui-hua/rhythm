# 当前数据库结构快照

本文档基于 Supabase MCP 查询结果整理，反映当前远程数据库中的主要表结构。

更新时间：2026-05-13

## 使用说明

1. 这是一份结构快照，不是可执行 schema
2. 真实状态以 Supabase MCP 即时查询为准
3. 当远程数据库结构变更后，应同步更新本文件

## 核心表

### `public.goal`

主要字段：

- `id`
- `user_id`
- `title`
- `description`
- `year`
- `category_id`
- `carry_over_lookback_days`
- `task_time`
- `duration`
- `status`
- `priority`
- `created_at`
- `updated_at`

说明：

- 原名 `plans`，Phase 2 更名为 `goal`
- 已包含 Day / Direction 依赖的 `task_time`、`duration`
- `carry_over_lookback_days` 用于 Day 页面只读补查历史未完成目标日计划，`0` 表示关闭
- `category_id` 外键指向 `goal_categories.id`

### `public.goal_months`

主要字段：

- `id`
- `goal_id`（原名 `plan_id`）
- `user_id`
- `title`
- `description`
- `month`
- `task_time`
- `duration`
- `status`
- `priority`
- `created_at`
- `updated_at`

说明：

- 原名 `monthly_plans`，Phase 2 更名为 `goal_months`
- 已包含时间继承链需要的 `task_time`、`duration`
- `goal_id` 外键指向 `goal.id`

### `public.goal_days`

主要字段：

- `id`
- `goal_month_id`（原名 `monthly_plan_id`）
- `user_id`
- `title`
- `description`
- `day`
- `task_time`
- `duration`
- `status`
- `priority`
- `created_at`
- `updated_at`

说明：

- 原名 `daily_plans`，Phase 2 更名为 `goal_days`
- 当前 `status` 为 `smallint`
- `goal_month_id` 外键指向 `goal_months.id`

### `public.habit`

主要字段：

- `id`
- `user_id`
- `title`
- `frequency`
- `target_value`
- `is_archived`
- `task_time`
- `duration`
- `created_at`
- `updated_at`

说明：

- 原名 `habits`，Phase 2 更名为 `habit`
- `frequency` 当前运行时约定为 JSON 结构：
  - `{ "type": "daily" }`
  - `{ "type": "weekly", "weekdays": [1, 3, 5] }`
  - `{ "type": "monthly", "monthDays": [1, 15, 28] }`

### `public.habit_logs`

主要字段：

- `id`
- `habit_id`
- `user_id`
- `log`
- `value`
- `completed_at`

说明：

- 表名保持不变
- `habit_id` 外键指向 `habit.id`
- `user_id` 外键指向 `auth.users.id`

### `public.task`

主要字段：

- `id`
- `user_id`
- `title`
- `description`
- `start_time`
- `end_time`
- `actual_start_time`
- `actual_end_time`
- `completed`
- `created_at`
- `updated_at`

说明：

- 原名 `tasks`，Phase 2 更名为 `task`
- 已包含 Pomodoro 和任务计时依赖字段

### `public.summary`

当前表结构 / 当前快照：

- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `kind` (text, daily/weekly/monthly/yearly)
- `period_start` (timestamptz)
- `period_end` (timestamptz)
- `title` (text, nullable)
- `content` (jsonb)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

说明：

- 原名 `summaries`，Phase 2 更名为 `summary`
- 已从 `scope` 字段迁移到 `kind` + `period_start/end`

### `public.goal_categories`

主要字段：

- `id`
- `user_id`
- `name`
- `sort_order`
- `created_at`
- `updated_at`

说明：

- 原名 `plans_category`，Phase 2 更名为 `goal_categories`

### `public.daily_report_log`

主要字段：

- `id`
- `user_id`
- `report_date`
- `created_at`

说明：

- 原名 `daily_report_views`，Phase 2 更名为 `daily_report_log`

## 当前表数量与数据量

2026-05-13 查询结果（Phase 2 重命名后）：

| 表名 | 行数 | 说明 |
|------|------|------|
| `goal` | 18 | 原 `plans` |
| `goal_months` | 128 | 原 `monthly_plans` |
| `goal_days` | 60 | 原 `daily_plans` |
| `habit` | 29 | 原 `habits` |
| `habit_logs` | 163 | 保持不变 |
| `task` | 284 | 原 `tasks` |
| `summary` | 4 | 原 `summaries` |
| `goal_categories` | 7 | 原 `plans_category` |
| `daily_report_log` | 62 | 原 `daily_report_views` |
## 服务层表名映射

表名常量定义见 `src/services/db/tables.js`。

| 服务层导出 | 当前表名 |
|-----------|---------|
| `db.goal` | `goal` |
| `db.goalMonths` | `goal_months` |
| `db.goalDays` | `goal_days` |
| `db.goalCategories` | `goal_categories` |
| `db.task` | `task` |
| `db.habit` | `habit` |
| `db.summary` | `summary` |
| `db.dailyReportLog` | `daily_report_log` |
