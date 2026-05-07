# AGENTS.md

本文件为在本仓库内工作的各类代码代理提供统一协作说明，内容依据 `CLAUDE.md` 整理，并补充为更通用的 Agent 执行约束。

## 项目概况

- 项目名称：`rhythm`
- 前端框架：Vue 3（Composition API + `<script setup>`）
- 构建工具：Vite 7
- 样式体系：Tailwind CSS 4（CSS-first，设计令牌定义在 `src/assets/tw-theme.css`）
- 状态管理：Pinia（`authStore` 启用持久化）
- 数据服务：Supabase
- UI / 工具库：VueUse、Radix Vue、Reka UI
- 语言现状：项目以 JavaScript 为主，配合 TypeScript 工具链

## 常用命令

```bash
pnpm dev       # 启动开发服务器
pnpm build     # 生产构建
pnpm preview   # 预览生产构建
pnpm vue-tsc   # TypeScript 类型检查
```

环境变量要求：

- 复制 `.env.example` 为 `.env`
- 填入 `VITE_SUPABASE_URL`
- 填入 `VITE_SUPABASE_KEY`

## 路由与模块结构

| 路由 | 模块 | 说明 |
|------|------|------|
| `/direction` | Direction | 长期目标管理，三级级联：`plans → monthly_plans → daily_plans` |
| `/habits` | Habits | 周期行为追踪，包含热力图日历与数据统计 |
| `/day/:year/:month/:day` | Timeline | 每日时间轴，聚合 Task、DailyPlan、Habit 三种数据源 |
| `/month/:year/:month` | Month | 月度视图 |
| `/year/:year` | Year | 年度总览 |
| `/summary` | Summary | 日 / 周 / 月 / 年总结 |

详细模块文档位于 `docs/modules/`，包含：

- `direction`
- `day`
- `habits`
- `summary`
- `month-year`
- `login`
- `app`
- `framework`
- `common`
- `ui-components`

## 数据层约定

项目存在两套数据库访问服务：

- `src/services/database.js`
  - 导出 `db`
  - 用于底层直连与 RPC 调用
- `src/services/safeDb.js`
  - 导出 `safeDb`
  - 在失败时自动给出 toast 错误提示
  - `Direction` 模块统一使用 `safeDb`

Supabase 扩展约定：

- `supabase.createBase(tableName)` 用于生成标准 CRUD 对象
- 标准能力包含：`list`、`getById`、`create`、`update`、`delete`、`query`

数据库真相源约定：

- 以 Supabase MCP 查询到的线上真实结构为准
- 仓库内当前结构说明见 `database/current-structure.md`

### RPC 批量操作

Direction 模块通过 RPC 实现批量写入：

- `batch_upsert_daily_plans`
- `batch_delete_daily_plans`

## 状态管理

- `src/stores/authStore.js`：用户认证，启用 `persist: true`
- `src/stores/dateStore.js`：日期状态
- `src/stores/uiStore.js`：界面状态
- `src/stores/pomodoroStore.js`：番茄钟状态

## 组件与 Composables 规范

所有代理在修改 Vue 页面时，遵守以下规则：

1. 使用 `<script setup>` 语法。
2. 文件结构保持为：`template → script → style`。
3. 核心业务逻辑放入 `src/views/[module]/composables/`，组件只负责 UI、交互编排和状态展示。
4. 不在组件内部直接堆叠核心业务逻辑，优先通过 Composable 引入。
5. 样式优先使用 Tailwind。
6. 可复用样式提取到 `<style scoped>` 并配合 `@apply`，避免在模板中堆积过长 class。
7. 组件保持单一职责，超过 300 行时优先评估拆分。
8. 导入路径统一优先使用 `@/` 别名。

## Tailwind 与主题

- 主题配置文件：`src/assets/tw-theme.css`
- 使用 `@theme inline` 定义设计令牌
- 需要兼容 light / dark 双主题

新增样式时的要求：

- 优先复用已有 token
- 不直接引入与当前主题体系冲突的硬编码颜色
- 调整 UI 时先确认对应模块是否已有封装组件或公共样式

## 路由守卫与认证

- 路由守卫位于 `src/router/index.js`
- `beforeEach` 依据 `authStore.userId` 判断登录状态
- 未登录用户统一重定向到 `/login`

涉及登录态、跳转控制、首屏初始化的改动时，必须同步检查：

- 路由守卫逻辑
- `authStore` 数据流
- 页面初始化时对登录状态的依赖

## 代理协作偏好

- 方案、计划、总结优先沉淀到仓库文档，不只保留在对话中。
- 如果新增计划文档，使用中文编写，文件名使用中文。
- 计划文档需要明确目录、文件、改动点和影响范围，避免模糊表达。
- 如果存在成熟、适配当前项目的现成库或已有封装，优先复用，不重复手写同类能力。
- 写代码时优先补充有解释价值的注释，不添加无信息量注释。
- 写代码时可以多加注释，但注释要优先解释查询拼装、关键判断、数据语义和边界约束这类不直观逻辑，不堆砌无信息量描述。
- 修改前先理解对应模块文档、数据流和 Composable 入口，避免直接在组件表层修补。

## Git 偏好

- 实现计划执行过程中，不要提前提交 commit。
- 所有代码编写完成后，再统一进行提交。
