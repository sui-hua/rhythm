# 当前数据库结构快照

本文档基于 Supabase MCP 查询结果整理，反映当前远程数据库中的主要表结构。

更新时间：2026-04-18

## 使用说明

1. 这是一份结构快照，不是可执行 schema
2. 真实状态以 Supabase MCP 即时查询为准
3. 当远程数据库结构变更后，应同步更新本文件

## 核心表

### `public.plans`

主要字段：

- `id`
- `user_id`
- `title`
- `description`
- `year`
- `category_id`
- `task_time`
- `duration`
- `status`
- `priority`
- `created_at`
- `updated_at`

说明：

- 已包含 Day / Direction 依赖的 `task_time`、`duration`
- `category_id` 外键指向 `plans_category.id`

### `public.monthly_plans`

主要字段：

- `id`
- `plan_id`
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

- 已包含时间继承链需要的 `task_time`、`duration`
- `plan_id` 外键指向 `plans.id`

### `public.daily_plans`

主要字段：

- `id`
- `monthly_plan_id`
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

- 当前 `status` 为 `smallint`
- `monthly_plan_id` 外键指向 `monthly_plans.id`

### `public.habits`

主要字段：

- `id`
- `user_id`
- `title`
- `frequency`
- `target_value`
- `archived`
- `is_archived`
- `task_time`
- `duration`
- `created_at`
- `updated_at`

说明：

- 当前线上同时存在 `archived` 和 `is_archived`
- 前端后续应统一到一套字段命名
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

- 已存在 `user_id`
- `habit_id` 外键指向 `habits.id`

### `public.tasks`

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

- 已包含 Pomodoro 和任务计时依赖字段

### `public.summaries`

当前表结构 / 当前快照：

- `id`
- `user_id`
- `scope`
- `kind`
- `period_start`
- `period_end`
- `title`
- `content`
- `mood`
- `created_at`
- `updated_at`

当前仍存在的兼容列：

- `scope`：当前仍然是数据库层 mandatory 字段；线上约束未包含 `day`，写入层会把历史 `day` 归一为 `week` 后再提交

约束 / 默认值：

- `id` 默认值仍为 `uuid_generate_v4()`
- `user_id` 仍为必填列
- `scope` 仍为 `NOT NULL`，且受 `summaries_scope_check` 约束限制为 `year|quarter|month|week`
- `content` 当前类型为 `jsonb`
- `created_at` 默认值仍为 `now()`
- `updated_at` 默认值仍为 `now()`

迁移 / 兼容说明：

- 已完成第一阶段非破坏性结构改造
- 运行时已经冻结到统一的 `summaries`
- 正式读取与写入模型已收敛为 `kind + period_start + period_end`
- `scope` 仍然需要由写入层兼容补齐，但只能写入数据库实际允许的值；`day` 不再是可直接写入值
- `daily_summaries` 仅作为回退或审计用途的遗留保留对象，不是正常读写路径

### `public.daily_summaries`

当前主要字段：

- `id`
- `user_id`
- `today_did`
- `today_issue`
- `tomorrow_fix`
- `mood`
- `created_at`

现状说明：

- 仍是旧模型
- 仅作回退或审计保留，不是正常读写路径
- 运行时已经冻结到统一的 `summaries`

### `public.plans_category`

主要字段：

- `id`
- `user_id`
- `name`
- `sort_order`
- `created_at`
- `updated_at`

### `public.daily_report_views`

主要字段：

- `id`
- `user_id`
- `report_date`
- `created_at`

## 当前重点问题

基于 MCP 查询，当前真正还需要统一的数据库问题主要集中在：

1. `daily_summaries` 仍然是旧结构
2. `habits` 同时存在 `archived` 和 `is_archived`
3. 线上当前缺失 `batch_upsert_daily_plans` / `batch_delete_daily_plans` 这两个 RPC，相关批量日计划操作不能假设数据库侧已具备这两项能力

## 当前表数量与数据量

2026-04-18 查询结果：

- `plans`: 18
- `monthly_plans`: 128
- `daily_plans`: 51
- `habits`: 23
- `habit_logs`: 65
- `tasks`: 246
- `summaries`: 0
- `daily_summaries`: 0
- `plans_category`: 7
- `daily_report_views`: 36
