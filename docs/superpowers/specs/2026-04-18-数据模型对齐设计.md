# Rhythm 数据模型对齐设计

## 背景

当前代码与数据库定义在几个核心区域已经出现明显脱节：

1. `plans`、`monthly_plans`、`daily_plans`、`habits` 缺少前端已经在读写的字段，尤其是 `task_time` 和 `duration`。
2. 总结模块同时混用了 `summaries` 和 `daily_summaries` 两套不兼容的数据模型。
3. 月视图 / 日视图路由没有年份参数，但数据查询又依赖独立的 `dateStore` 年份。
4. Direction 首屏加载大量串行请求，数据量增长后会明显变慢。

本设计的目标是在不破坏现有产品心智的前提下，把应用重新收敛到统一、可维护的数据契约上：

- Direction / Habits / Day 仍然保持现有用户视角下的独立模块
- 日 / 周 / 月 / 年总结仍然保持独立的交互体验
- 底层持久化模型、服务接口与路由真相源统一起来

## 目标

1. 让 Supabase MCP 查询到的线上真实结构与仓库内的 `database/current-structure.md` 保持一致。
2. 统一总结模块的底层持久化模型，同时保留不同类型总结的 UI 体验差异。
3. 让年份成为导航和查询的显式真相源。
4. 在不做无关重构的前提下，降低 Direction 首屏加载延迟。

## 非目标

1. 不重做 Direction、Habits、Day、Summary 页面的整体布局。
2. 不做超出本次问题范围的大规模数据库服务重构。
3. 不保留长期的总结双读 / 双写兼容层。

## 设计概览

本次工作拆成 4 条主线，并按顺序推进：

1. Supabase MCP 结构对齐
2. 总结模型统一
3. 年份路由显式化
4. Direction 首屏加载优化

数据库结构以 Supabase MCP 查询到的线上真实状态为准，仓库内只保留基于 MCP 的结构说明。服务层负责把数据库记录适配成 UI 需要的形状，页面不再直接依赖缺失字段、隐式状态或历史遗留结构。

## 一、Supabase MCP 结构对齐

### 1.1 必须补齐的表字段

线上真实数据库结构必须先对齐当前前端已经在使用的字段，并同步更新 `database/current-structure.md`。

#### `plans`

新增：

- `task_time TIME`
- `duration INTEGER`

保留现有的规划属性：

- `title`
- `description`
- `year`
- `status`
- `priority`

#### `monthly_plans`

新增：

- `task_time TIME`
- `duration INTEGER`

这样可以保留 Day 视图当前已经存在的时间继承链：

- 日计划自身时间
- 月计划继承时间
- 上层计划继承时间

#### `daily_plans`

新增：

- `task_time TIME`
- `duration INTEGER`

保留：

- `(monthly_plan_id, day)` 唯一约束
- 来自 `monthly_plans` 的级联删除语义

同时更新批量 RPC，使其正式依赖已声明字段，而不是依赖 schema 中未定义的列。

#### `habits`

新增：

- `task_time TIME`
- `duration INTEGER`

归档字段需要统一命名。当前 schema 使用 `archived`，但前端已经在使用 `is_archived`。

推荐方案：

1. 在 schema 中补上 `is_archived BOOLEAN DEFAULT FALSE`
2. 把旧 `archived` 数据迁移到 `is_archived`
3. 前端统一只读写 `is_archived`

#### `tasks`

补齐 Day / Pomodoro 已经依赖的实际计时字段：

- `actual_start_time TIMESTAMP WITH TIME ZONE`
- `actual_end_time TIMESTAMP WITH TIME ZONE`

#### `habit_logs`

显式补齐所有权字段：

- 保留 `habit_id`
- 新增 `user_id UUID NOT NULL`

原因：

1. 简化 RLS
2. 避免依赖跨表子查询才能确认归属
3. 与项目其他表保持统一的所有权模型

当前 schema 中关于 `habit_logs` 的注释和 `ALTER TABLE` 片段明显是生成过程中的半成品，应该替换成最终版的明确结构。

### 1.2 结构清理

在补字段的同时，顺手清理这些结构性问题：

1. 删除重复索引定义
2. 清除数据库说明中的过期结构描述，保证文档只保留有效结构信息
3. 保证每张前端会直接使用的表都有明确的 `user_id` 与 RLS 规则
4. 统一命名风格，避免同类字段出现两套命名

## 二、总结模型统一

### 2.1 产品层决策

总结页继续保留四种总结体验：

- `daily`
- `weekly`
- `monthly`
- `yearly`

但底层数据库只保留一套正式运行时模型。

### 2.2 正式运行表

以 `summaries` 作为唯一正式运行表。

建议字段：

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL`
- `kind TEXT NOT NULL`
- `period_start TIMESTAMP WITH TIME ZONE NOT NULL`
- `period_end TIMESTAMP WITH TIME ZONE NOT NULL`
- `title TEXT`
- `content JSONB NOT NULL`
- `mood INTEGER`
- `created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`

`kind` 允许值：

- `daily`
- `weekly`
- `monthly`
- `yearly`

### 2.3 SummaryRecord 统一实体

前端后续统一围绕这一种记录结构工作：

```ts
type SummaryRecord = {
  id: string
  user_id: string
  kind: 'daily' | 'weekly' | 'monthly' | 'yearly'
  period_start: string
  period_end: string
  title: string | null
  content: Record<string, unknown>
  mood: number | null
  created_at: string
  updated_at: string
}
```

### 2.4 不同 kind 的内容结构

#### `daily`

`content` 存为：

```json
{
  "done": "string",
  "improve": "string",
  "tomorrow": "string"
}
```

#### `weekly` / `monthly` / `yearly`

`content` 存为：

```json
{
  "text": "string"
}
```

这样可以保留“日总结结构化、周期总结自由文本”的产品意图，又不会把底层模型拆成两套。

### 2.5 UI 行为

#### Tab

页面继续保留：

- 日总结
- 周总结
- 月总结
- 年总结

每个 tab 直接映射到一个 `kind`。

#### 表单

- `daily` 使用结构化表单：`done`、`improve`、`tomorrow`
- `weekly` / `monthly` / `yearly` 使用通用表单：`title`、`text`、`mood`

#### 左侧列表标题规则

- `daily`：优先展示 `content.done` 的首段摘要，空时显示固定占位文案
- `weekly` / `monthly` / `yearly`：优先展示 `title`，没有则回退到 `content.text` 摘要

#### 左侧列表日期规则

- `daily`：根据 `period_start` 展示单日
- `weekly`：根据 `period_start ~ period_end` 展示区间
- `monthly`：根据 `period_start` 展示年月
- `yearly`：根据 `period_start` 展示年份

页面必须彻底停止依赖不存在的 `summary.date`，也不能再假设日总结内容存在于顶层字符串字段中。

### 2.6 总结服务层

用一个统一服务模块替换当前分裂的读写逻辑，再由 adapter 负责数据库记录和表单数据的相互转换。

建议服务接口：

- `listByKind(kind)`
- `getById(id)`
- `save(record)`
- `remove(id)`
- `buildDefaultPeriod(kind, anchorDate)`
- `toFormModel(record)`
- `fromFormModel({ kind, formData, period, userId, existingRecord })`

页面和表单层不应再直接知道数据库表级差异。

### 2.7 迁移策略

不保留长期双读 / 双写。

#### 迁移来源

- 旧 `daily_summaries`
- 旧 `summaries`

#### 迁移目标

- 新规范化后的 `summaries`

#### 日总结迁移

把旧 `daily_summaries` 迁成：

- `kind = 'daily'`
- `period_start = created_at 所在日的 00:00:00`
- `period_end = created_at 所在日的 23:59:59`
- `title = null`
- `content = { done: today_did, improve: today_issue, tomorrow: tomorrow_fix }`
- 保留 `mood`、`created_at`

#### 旧 summaries 迁移

把旧 `summaries.scope` 映射成：

- `week -> weekly`
- `month -> monthly`
- `year -> yearly`

把旧文本内容映射成：

- `content = { text: old_content }`

周期范围映射规则：

- `weekly`：按旧记录时间推导周起止
- `monthly`：按旧记录时间推导月起止
- `yearly`：按旧记录时间推导年起止

#### quarter 历史数据

旧 `quarter` 数据不在当前 UI 范围内，不能被偷换语义后强行挂到月 / 年标签下。

处理策略：

1. 不把 `quarter` 迁成 `monthly`
2. 不把 `quarter` 迁成 `yearly`
3. 先保留在备份或导出数据里，不进入当前运行时模型
4. 等未来明确支持季度总结时再单独设计迁移策略

这样可以避免历史数据被错误解释。

### 2.8 迁移期安全策略

迁移前：

1. 备份旧 `summaries`
2. 备份旧 `daily_summaries`

迁移后：

1. 前端只读新的 `summaries`
2. 前端只写新的 `summaries`
3. 旧表只保留回滚和审计用途，不再参与运行时逻辑

## 三、年份路由显式化

### 3.1 当前问题

当前应用使用的路由类似：

- `/month/:month`
- `/day/:month/:day`

但查询实际使用的是 `dateStore.currentDate.getFullYear()`。

这会导致下面几类问题：

1. 跨年切换时路由和查询状态脱节
2. 查看历史年份时 URL 不能表达真实上下文
3. 12 月跳到次年 1 月时容易取错数据

### 3.2 路由规范

把年份提升为显式参数。

建议路由：

- `/year/:year`
- `/month/:year/:month`
- `/day/:year/:month/:day`

保留一个便捷入口：

- `/day` 重定向到“今天”的完整年月日路由

### 3.3 真相源约定

改造后：

1. 路由参数成为当前日期上下文的第一真相源
2. `dateStore` 退化成同步用的应用级辅助状态，不再主导查询
3. Navbar 的前一天 / 后一天跳转必须按完整年月日计算

### 3.4 需要一起更新的消费方

要同步修改：

- 路由定义
- Navbar 导航逻辑
- Month 视图数据获取
- Day 视图数据获取
- 所有生成 year / month / day 链接的辅助方法

## 四、Direction 首屏加载优化

### 4.1 当前问题

Direction 当前首屏大致是这样加载的：

1. 取全部 plans
2. 遍历每个 plan 串行拉 monthly_plans
3. 遍历每个 monthly_plan 串行拉 daily_plans

这是典型的串行 N+1。

### 4.2 优化方案

建议分两步做：

#### 第一步：并发化现有请求

在不明显改变行为的前提下：

- 用 `Promise.all` 并发拉 monthly_plans
- 用 `Promise.all` 并发拉 daily_plans

这一层改动风险低，能先拿到一轮可观收益。

#### 第二步：可选的后端聚合

如果第一步后 Direction 仍然偏慢，再考虑进一步做嵌套查询或 RPC 聚合，一次返回：

- plans
- monthly_plans
- daily_plans

这一步是可选优化，不作为本次设计的首要落地路径。

## 五、错误处理

### 5.1 总结模块

1. 服务层写入时统一补齐 `user_id`
2. `content` 结构不合法时，在 adapter 边界归一化
3. 标题 / 正文缺失时，侧栏展示平稳降级，不出现空白标题

### 5.2 迁移

1. 如果源表缺字段，迁移必须显式失败
2. 迁移过程要么幂等，要么明确阻止重复导入
3. 对不支持的 `quarter` 数据要有可见报告

### 5.3 路由

1. 非法年 / 月 / 日参数要重定向到最近的合法 canonical route
2. 前后一天切换必须正确跨月、跨年

## 六、测试策略

### 6.1 数据库结构验证

1. 通过 Supabase MCP 校验前端 CRUD 依赖的字段都已存在于线上真实结构
2. 校验 RLS 仍然允许本用户读写，拒绝跨用户访问
3. 校验 daily_plan 批量 RPC 正常工作

### 6.2 总结模块

1. `daily` 总结可以创建、编辑、列表展示、删除
2. `weekly` / `monthly` / `yearly` 总结可以创建、编辑、列表展示、删除
3. 侧栏日期和标题展示符合对应 `kind`
4. 旧数据迁移后的记录能正常渲染
5. `quarter` 历史数据不会被静默挂到错误 tab

### 6.3 路由

1. `/day/:year/:month/:day` 能加载正确日期数据
2. 前一天 / 后一天按钮能正确跨月、跨年
3. 月视图 / 年视图按 URL 中的年份查询，而不是按隐式 store 年份查询

### 6.4 Direction 性能

1. Direction 仍能拿到完整 plan 树
2. 请求数或总耗时相对串行版本有下降

## 七、实施顺序

1. 通过 Supabase MCP 执行第一阶段数据库变更，并更新 `database/current-structure.md` / `database/README.md`
2. 新增总结迁移路径，把 `summaries` 规范化成唯一运行时表
3. 重写 `src/services/db/summaries.js`，收敛成统一服务 + adapter
4. 更新总结页、侧栏和表单，使其统一消费 `SummaryRecord`
5. 规范年份路由，并更新所有依赖 year / month / day 链接的消费方
6. 把 Direction 首屏加载改成并发请求

## 八、风险

1. Schema 变更会同时影响多个模块，半完成状态会非常脆弱
2. 总结迁移如果随意重解释旧数据，容易损失语义准确性
3. 路由规范化后，旧书签如果没有重定向会失效

## 九、本设计已确认的关键决策

1. 总结体验按类型区分，但底层持久化统一
2. `summaries` 是唯一正式运行时总结表
3. 不保留长期总结双读兼容层
4. 年份进入路由，成为显式真相源
5. Direction 优化先做并发，再视情况决定是否做 RPC 聚合
