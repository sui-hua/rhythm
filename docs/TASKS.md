# 后端开发执行清单

---

## 阶段 0：基础设施与全局层

### 0.1 封装全局 Prisma 模块
- [ ] 创建 `apps/api/src/prisma/prisma.service.ts`，继承 `PrismaClient` 并挂载生命周期方法 `$connect()` 与 `$disconnect()`
- [ ] 创建 `apps/api/src/prisma/prisma.module.ts`，声明 `@Global()` 并导出 `PrismaService`
- [ ] 在 `apps/api/src/app.module.ts` 中注册 `PrismaModule`，执行 `pnpm --filter @rhythm/api run start:dev` 验证数据库连接

### 0.2 全局通用切面配置
- [ ] 创建 `apps/api/src/common/interceptors/transform.interceptor.ts`，统一响应格式为 `{ code: 200, message: "ok", data }`
- [ ] 创建 `apps/api/src/common/filters/all-exceptions.filter.ts`，统一处理 Prisma 与 HTTP 异常报错响应
- [ ] 创建 `apps/api/src/common/pipes/validation.pipe.ts`，配置全局 DTO 参数校验

---

## 阶段 1：用户认证与会话模块 (AuthModule)

### 1.1 依赖安装与加盐配置
- [ ] 安装 `@nestjs/jwt`、`bcryptjs`、`@types/bcryptjs`、`@nestjs/config`
- [ ] 配置 JWT 密钥与双 Token 过期时间（Access Token 15 分钟，Refresh Token 7 天）

### 1.2 认证接口实现
- [ ] `POST /api/auth/register`：邮箱密码注册，使用 bcrypt 加盐哈希密码，写入 `sys_user` 表
- [ ] `POST /api/auth/login`：用户登录验证，签发双 Token，哈希存储 Refresh Token 至 `sys_refresh_token` 表
- [ ] `POST /api/auth/refresh`：无感刷新，验证旧 Refresh Token，轮转签发新双 Token 并更新数据库
- [ ] `POST /api/auth/logout`：用户登出，撤销/删除对应的 Refresh Token 记录

### 1.3 全局鉴权守卫与装饰器
- [ ] 创建 `apps/api/src/common/guards/jwt-auth.guard.ts`，注册为全局守卫
- [ ] 创建 `apps/api/src/common/decorators/public.decorator.ts`，支持 `@Public()` 豁免登录检查
- [ ] 创建 `apps/api/src/common/decorators/current-user.decorator.ts`，支持 `@CurrentUser()` 提取用户 ID

---

## 阶段 2：通用分类模块 (CategoryModule)

### 2.1 分类管理接口
- [ ] `GET /api/categories`：获取当前用户的所有分类列表，按 `sort_order ASC` 排序
- [ ] `POST /api/categories`：新建分类，包含分类名称与排序权重，校验同用户下名称唯一性
- [ ] `PATCH /api/categories/:id`：修改分类名称或排序权重
- [ ] `DELETE /api/categories/:id`：删除分类，解除其与任务及目标的关联关系

---

## 阶段 3：时序与日程任务模块 (TaskModule)

### 3.1 日程任务接口
- [ ] `GET /api/tasks?date=YYYY-MM-DD`：获取指定日期的日程时间轴任务列表
- [ ] `GET /api/tasks/inbox`：获取未排期的收集箱任务列表（`plan_time` 为空且未完成）
- [ ] `POST /api/tasks`：新建日程任务，支持关联 `category_id`、设定计划起止时间或执行时长
- [ ] `PATCH /api/tasks/:id`：编辑任务标题、描述、计划时间或所属分类
- [ ] `PATCH /api/tasks/:id/toggle`：快捷切换任务完成状态（`completed`）
- [ ] `DELETE /api/tasks/:id`：删除任务

---

## 阶段 4：习惯打卡与热力追踪 (HabitModule)

### 4.1 习惯配置管理
- [ ] `GET /api/habits`：查询当前用户活跃习惯列表，并聚合计算当前连击天数（`streak`）、年度累计打卡天数（`totalYear`）及今日完成状态（`completedToday`）
- [ ] `POST /api/habits`：新建习惯，设定重复规则（`repeat_type`、`repeat_days`）与排期时长
- [ ] `PATCH /api/habits/:id`：更新习惯配置或切换归档状态（`archived`）
- [ ] `DELETE /api/habits/:id`：删除习惯及其所有历史打卡日志

### 4.2 习惯打卡操作与点阵日志
- [ ] `POST /api/habits/:id/checkin`：习惯打卡/取消打卡（幂等写入或物理删除 `habit_log` 记录）
- [ ] `GET /api/habits/:id/logs`：查询习惯的历史打卡日期点阵数据（用于月度/年度热力图渲染）

---

## 阶段 5：所向与目标拆解系统 (GoalModule)

### 5.1 年目标管理
- [ ] `GET /api/goals`：获取年目标列表及分类归属，计算目标达成进度百分比
- [ ] `POST /api/goals`：新建年目标，配置起止月份跨度与顺延回溯天数（`carry_over_lookback_days`）
- [ ] `PATCH /api/goals/:id`：编辑年目标配置或更新目标状态（`status`）
- [ ] `DELETE /api/goals/:id`：删除年目标，级联删除月度战役与日计划

### 5.2 月度战役与日度打卡下沉
- [ ] `GET /api/goals/:id/months`：获取目标拆解的 12 个月度战役列表
- [ ] `PATCH /api/goals/months/:monthId`：设置月度核心战役标题、状态与排期
- [ ] `GET /api/goals/months/:monthId/days`：获取月度战役下的日打卡分布（1~31 号）
- [ ] `POST /api/goals/days/toggle`：日度目标快捷打卡与取消

---

## 阶段 6：复盘沉淀与系统报表 (SummaryModule)

### 6.1 结构化复盘
- [ ] `GET /api/summary?periodType=xxx&date=xxx`：查询日/周/月/年周期的复盘总结
- [ ] `PUT /api/summary`：保存或更新 JSON 结构化复盘内容（收获、不足、明日规划）

### 6.2 报表与统计汇总
- [ ] `GET /api/reports/daily?date=YYYY-MM-DD`：自动汇总当日任务完成率、习惯打卡数，生成每日报告日志记录并落库 `daily_report_log`
