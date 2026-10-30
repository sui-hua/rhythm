# Rhythm 迁移 TODO

> 目标：把 web(Vue) 的 Supabase 数据层在 NestJS 复刻一份，移动端与 Next 端按 web 逻辑平移。
> **硬约束：`apps/web` 不做任何改动。**
> 另：构建验证统一用 `tsc --noEmit` 与 `next build`，避免执行会清空 `dist` 的 `nest build`。

图例：`[x]` 已完成　`[ ]` 未开始　`[~]` 进行中

---

## 阶段 0 · 基础设施

- [x] Docker 起 Postgres（`docker-compose.yml`，容器 `postgres`，库 `rhythm`，时区 Asia/Shanghai）
- [x] 安装并锁定 Prisma 7.10.1（CLI 与 client 版本对齐，避开 8.0.0-rc）
- [x] 从 Supabase 自省结构，清理成 9 张业务表
- [x] `prisma migrate dev --init` 本地建表成功
- [x] `PrismaService` / `PrismaModule`（`@Global`，走 `@prisma/adapter-pg`）
- [x] 根脚本 `db:pull` / `db:migrate` / `db:push` / `db:studio` / `db:generate`
- [x] `apps/api/prisma/seed.mjs` 演示数据（原生 pg + 确定性 uuid，可重复执行）

## 阶段 1 · Nest 复刻 web 数据层

### 通用能力

- [x] `CurrentUserId` 装饰器（暂用 `x-user-id` 请求头，接认证后只改这一处）
- [x] `db-serializers`：把 Prisma 的 Date 还原成 Supabase 的 `YYYY-MM-DD` / `HH:mm:ss` 格式
- [x] `formatLocalDateOnly`：timestamptz 按本地时区取日期，避免总结日期差一天
- [x] `date-range`：本地自然日区间、`toDateOnly`、`subtractDays`

### 资源模块

- [x] **tasks** — list（start_time 区间升序）/ inbox（无时间未完成）/ getById / create / update / delete
- [x] **habits** — list（含归档开关）/ create / update / delete
- [x] **habits logs** — 按区间 / 按习惯 / 按年份 / 打卡（同自然日幂等）/ 取消打卡
- [x] **goals** — list（含分类关联）/ **overview（三级嵌套）** / CRUD
- [x] **goal_categories** — list（name 升序）/ CRUD
- [x] **goal_months** — list（按 goal_id，month 升序）/ CRUD
- [x] **goal_days** — list / deleteByIds / listByMonth / listByDate / day-view（结转回溯）
- [x] **summaries** — listByKind / getByDateKind / create / update / delete
- [x] **daily_report_log** — getByUserAndDate / create（唯一约束冲突时返回既有记录）

### 阶段 1 验收

- [x] `tsc --noEmit` 通过
- [x] e2e 19 个用例全过（含 overview 三级结构、热力图区间日志、总结按日期命中）

---

## 阶段 2 · 移动端切到 Nest API

- [x] `src/services/api/` 客户端：`client.ts`（base URL + `x-user-id` + 超时与错误归一）、`session.ts`（本地会话）
- [x] 资源模块：tasks / habits / dailyPlans / goals / summaries，字段映射回原有领域类型
- [x] Day 页：`useDayExecutionItems` / `useExecutionItemToggle` / `useTaskMutations` 改调 API
- [x] Habits 页：`useHabits`（15 周区间日志一次拉取）+ `useHabitMutations`（打卡 / 新建）
- [x] Direction 页：`useDirectionData`（overview + categories）+ `useDirectionMutations`
- [x] Summary 页：`useSummaryList` / `useSummaryByDate` / `useSummaryMutations`，保留当日自动聚合预填
- [x] 登录页与「我的」页改为本地会话（`signInLocal` / `signOutLocal`）
- [x] 纯逻辑迁出 mocks：`domain/habits/stats.ts`、`domain/direction/progress.ts`、`domain/day/format.ts`
- [x] `grep` 确认 app/ 与 src/ 已无 `@/mocks` 引用（文件本身保留未删）
- [x] `tsc --noEmit` 通过
- [ ] jest 单测需在本机运行（沙箱内 jest 无法写临时文件，历史上一直跑不了）

## 阶段 3 · Next.js 端

- [x] `apps/web-next` 归入 workspace（包名 `@rhythm/web-next`，根脚本 `next:dev` / `next:build` / `next:typecheck`）
- [x] 数据层：`src/lib/api/`（client + 资源模块）、`useAsyncData` 轻量取数 hook
- [x] 纯逻辑：`src/lib/date.ts`、`habit-stats.ts`、`goal-progress.ts`
- [x] 布局：左侧导航（时序 / 习惯 / 所向 / 总结），zinc 浅色主题
- [x] 四个页面：`/day`、`/habits`、`/direction`、`/summary`，均支持读取与写入
- [x] `tsc --noEmit` 通过
- [x] `next build` 通过（5 个路由全部预渲染成功）

---

## 已知遗留

1. **`apps/web-next` 的独立文件未清理**：`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`node_modules`、`.next` 因为删除操作被安全策略拒绝而保留。
   现状是惰性的——根目录 `pnpm install` 只读根的 workspace 文件，这些不会生效。
   后续手动清理：`rm -rf apps/web-next/{pnpm-lock.yaml,pnpm-workspace.yaml,node_modules,.next}`。
2. **`apps/mobile/src/services/supabase/*` 与 `@supabase/supabase-js` 依赖仍在**，但已无引用。保留是为了回滚方便，确认不再需要后可整体移除。
3. **移动端会话不落盘**：重启 App 需重新登录，等后端 JWT 落地后替换 `session.ts`。

## 迁移中发现的问题（待决策）

1. **`task` 表没有 `status` 列** — 库里只有 `completed` 布尔值，web 代码里的
   `TaskStatus = inbox | scheduled | completed | archived` 从未落库。
   本实现的 inbox 语义改为「`start_time IS NULL AND completed = false`」。
2. **`goal.year` 是 `date` 类型**，web 接口声明为 `number`，两边理解不一致。
3. **`habit` 表没有 `description`** — 只有 `target_value`。移动端与 Next 端统一用
   「频率描述 · 目标 N」展示，替代原来的描述字段。
4. **`summary.period_start/period_end` 是 `timestamptz`** — 已解决：API 层用
   `formatLocalDateOnly` 按本地时区裁成 `YYYY-MM-DD` 返回，客户端不再自己切 ISO 字符串。
5. **`user_id` 无外键** — 自托管后 auth schema 被剔除，认证模块未建，目前靠请求头传值。
   三端统一使用 `DEV_USER_ID = 00000000-0000-4000-8000-000000000001`。
6. **RLS 未迁移** — Prisma 不管 RLS 策略，自托管后靠应用层 `user_id` 过滤保证隔离。
7. **打卡幂等依赖进程时区** — 自然日区间用 `new Date()` 的本地时区计算，所以 Node 进程必须
   与数据库同处 Asia/Shanghai；若将来部署到 UTC 机器，需改成显式时区换算。
8. **本地外键行为与线上可能有差异** — 自省出的 schema 没写 `onDelete`，Prisma 建表时对可空关系
   默认 `SetNull`；线上 Supabase 多为 `NO ACTION`。
9. **`task` 索引名 `asks_time_index`** 是线上笔误（少个 t），已原样保留，避免 Prisma 反复生成迁移。
10. **Next 16 Cache Components 会预渲染 Client Component** — 页面里直接 `new Date()` 会报
    「unstable value」。已用 `ClientOnly` 把依赖当前时间的视图延后到挂载后再渲染。
11. **三端 API 客户端重复** — mobile 与 web-next 各有一份字段映射。`packages/` 仍是空的，
    等接口稳定后抽 `@rhythm/api-client` 统一维护。
