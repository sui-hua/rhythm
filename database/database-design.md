### 1. **总计划模块 (Plans)**

| 字段            | 类型      | 说明                                   |
| ------------- | ------- | ------------------------------------ |
| `id`          | UUID    | 主键                                   |
| `user_id`     | UUID    | 用户ID                                 |
| `title`       | Text    | 计划名称                                 |
| `description` | Text    | 计划描述/愿景                              |
| `year`        | Date    | 计划所属年份（以 `DATE` 存储，例如：'2026-01-01'，用于月计划的年份归属） |
| `category`    | Varchar | 计划分类（例如：学习、健康、工作 - 旧版）                |
| `category_id` | UUID    | 关联的分组ID（外键，指向 `plans_category.id`）         |
| `status`      | Varchar | 状态：'active', 'completed', 'archived' |
| `priority`    | Int     | 优先级（使用数字，1-低，2-中，3-高）       |
| `start_date`  | Date    | 计划开始日期                               |
| `target_date` | Date    | 预计达成日期                               |

---

### 1.1 **计划分类模块 (Plan Categories)**

| 字段         | 类型      | 说明               |
| ---------- | ------- | ---------------- |
| `id`       | UUID    | 主键               |
| `user_id`  | UUID    | 用户ID             |
| `name`     | Text    | 分类名称           |
| `color`    | Text    | 分类颜色（Hex/HSL） |
| `icon`     | Text    | 分类图标名称       |
| `created_at` | Timestamp | 创建时间           |

---

### 2. **月计划模块 (Monthly Plans)**

| 字段            | 类型      | 说明                                   |
| ------------- | ------- | ------------------------------------ |
| `id`          | UUID    | 主键                                   |
| `plan_id`     | UUID    | 关联的总计划ID（外键，指向 `plans.id`）           |
| `user_id`     | UUID    | 用户ID                                 |
| `title`       | Text    | 月计划标题（例如：“吉他入门”）                     |
| `description` | Text    | 月计划描述                                |
| `status`      | Varchar | 状态：'active', 'completed', 'archived' |
| `priority`    | Int     | 优先级（使用数字，1-低，2-中，3-高）       |
| `year`        | Int     | 总计划所属年份（放在 `plans` 表中）            |
| `month`       | Date    | 月计划所属月份（以 `DATE` 存储当月第一天，例如：'2026-02-01'） |

---

### 3. **日计划模块 (Daily Plans)**

| 字段                | 类型      | 说明                                   |
| ----------------- | ------- | ------------------------------------ |
| `id`              | UUID    | 主键                                   |
| `monthly_plan_id` | UUID    | 关联的月计划ID（外键，指向 `monthly_plans.id`）   |
| `user_id`         | UUID    | 用户ID                                 |
| `title`           | Text    | 日计划标题（例如：“今天的吉他练习”）                  |
| `description`     | Text    | 日计划描述                                |
| `status`          | Varchar | 状态：'active', 'completed', 'archived' |
| `priority`        | Int     | 优先级（使用数字，1-低，2-中，3-高）       |
| `date`            | Date    | 日计划日期                                |
| `task_time`       | Time    | 计划时间（用于在天视图显示）               |

---

### 4. **习惯模块 (Habits)**

#### 4.1 **习惯定义表 (habits)**

| 字段             | 类型      | 说明                        |
| -------------- | ------- | ------------------------- |
| `id`           | UUID    | 主键                        |
| `user_id`      | UUID    | 用户ID                      |
| `title`        | Text    | 习惯名称                      |
| `frequency`    | JSONB   | 频率配置（如：{"type": "daily"}） |
| `target_value` | Int     | 每日/每次的目标值（例如：8杯水）         |
| `archived`     | Boolean | 是否已归档                     |
| `task_time`    | Time    | 计划时间（用于在天视图显示）   |
| `duration`     | Int     | 持续时间（分钟），用于在天视图显示其占用长度 |

#### 4.2 **习惯打卡记录表 (habit_logs)**

| 字段             | 类型        | 说明              |
| -------------- | --------- | --------------- |
| `id`           | UUID      | 主键              |
| `habit_id`     | UUID      | 关联的习惯ID         |
| `log`          | Text      | 打卡时的备注/记录文本（例如："30 分钟阅读"） |
| `completed_at` | Timestamp | 实际完成时间           |

---

### 5. **任务模块 (Tasks)**

| 字段            | 类型        | 说明                    |
| ------------- | --------- | --------------------- |
| `id`          | UUID      | 主键                    |
| `user_id`     | UUID      | 用户ID                  |
| `title`       | Text      | 任务标题                  |
| `description` | Text      | 任务详情                  |
| `start_time`  | Timestamp | 任务开始时间                |
| `end_time`    | Timestamp | 任务结束时间                |
| `completed`   | Boolean   | 是否完成                  |

---

### 6. **总结模块 (Summaries)**

#### 6.1 **周期总结表 (summaries)**

| 字段             | 类型        | 说明                                                 |
| -------------- | --------- | -------------------------------------------------- |
| `id`           | UUID      | 主键                                                 |
| `user_id`      | UUID      | 用户ID                                               |
| `scope`        | Varchar   | 总结范围：'year', 'quarter', 'month', 'week'             |
| `title`        | Text      | 总结标题（可选，用于列表展示）                               |
| `content`      | Text      | 原文总结（可选，富文本/Markdown）                         |
| `mood`         | Int       | 心情评分（1-5，可选）                                    |
| `created_at`   | Timestamp | 创建时间（可用于推导年月日）                              |

#### 6.2 **日总结表 (daily_summaries)**

| 字段             | 类型        | 说明                                  |
| -------------- | --------- | ----------------------------------- |
| `id`           | UUID      | 主键                                  |
| `user_id`      | UUID      | 用户ID                                |
| `today_did`    | Text      | 今天做了什么                            |
| `today_issue` | Text      | 今天问题                            |
| `tomorrow_fix` | Text      | 明天改进                              |
| `mood`         | Int       | 心情评分（1-5，可选）                   |
| `created_at`   | Timestamp | 创建时间                               |
