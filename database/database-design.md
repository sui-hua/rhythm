### 1. **总计划模块 (Plans)**

| 字段            | 类型      | 说明                                   |
| ------------- | ------- | ------------------------------------ |
| `id`          | UUID    | 主键                                   |
| `user_id`     | UUID    | 用户ID                                 |
| `title`       | Text    | 计划名称                                 |
| `description` | Text    | 计划描述/愿景                              |
| `category`    | Varchar | 计划分类（例如：学习、健康、工作）                |
| `status`      | Varchar | 状态：'active', 'completed', 'archived' |
| `priority`    | Int     | 优先级（使用数字，1-低，2-中，3-高）       |
| `start_date`  | Date    | 计划开始日期                               |
| `target_date` | Date    | 预计达成日期                               |

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
| `start_date`  | Date    | 月计划开始日期                              |
| `end_date`    | Date    | 月计划结束日期                              |

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

---

### 4. **习惯模块 (Habits)**

#### 4.1 **习惯定义表 (habits)**

| 字段             | 类型      | 说明                        |
| -------------- | ------- | ------------------------- |
| `id`           | UUID    | 主键                        |
| `user_id`      | UUID    | 用户ID                      |
| `plan_id`      | UUID    | 关联的计划ID（可以是总计划、月计划或日计划）   |
| `title`        | Text    | 习惯名称                      |
| `frequency`    | JSONB   | 频率配置（如：{"type": "daily"}） |
| `target_value` | Int     | 每日/每次的目标值（例如：8杯水）         |
| `archived`     | Boolean | 是否已归档                     |

#### 4.2 **习惯打卡记录表 (habit_logs)**

| 字段             | 类型        | 说明              |
| -------------- | --------- | --------------- |
| `id`           | UUID      | 主键              |
| `habit_id`     | UUID      | 关联的习惯ID         |
| `date`         | Date      | 打卡日期            |
| `value`        | Int       | 完成值（例如：1 或具体数量） |
| `completed_at` | Timestamp | 实际完成时间          |

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
| `priority`    | Int       | 优先级（使用数字，1-低，2-中，3-高） |

---

### 6. **总结模块 (Summaries)**

| 字段           | 类型        | 说明                                  |
| ------------ | --------- | ----------------------------------- |
| `id`         | UUID      | 主键                                  |
| `user_id`    | UUID      | 用户ID                                |
| `level`      | Varchar   | 总结层级：'year', 'month', 'week', 'day' |
| `content`    | Text      | 用户手写的总结内容                           |
| `source`     | Varchar   | 总结来源：'user'（用户手写）                   |
| `created_at` | Timestamp | 创建时间                                |
