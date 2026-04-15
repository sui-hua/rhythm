# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

```bash
pnpm dev        # 启动开发服务器
pnpm build      # 生产构建
pnpm preview    # 预览生产构建
pnpm vue-tsc   # TypeScript 类型检查
```

环境变量：复制 `.env.example` 为 `.env`，填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_KEY`。

## 技术栈

- **Vue 3** (Composition API + `<script setup>`)
- **Vite 7** + Tailwind CSS 4 (CSS-first，通过 `@theme inline` 定义 design tokens)
- **Pinia** (状态管理，authStore 启用了 persist 持久化)
- **Supabase** (PostgreSQL + Row Level Security)
- **VueUse** + **Radix Vue** + **Reka UI**
- **TypeScript** (项目主要使用 JS)

## 视图体系

| 路由 | 模块 | 说明 |
|------|------|------|
| `/direction` | Direction | 长期目标管理，三级级联：plans → monthly_plans → daily_plans |
| `/habits` | Habits | 周期行为追踪，热力图日历 + 数据统计 |
| `/day` | Timeline | 每日时间轴，统一聚合 Task、DailyPlan、Habit 三种数据源 |
| `/month/:monthIndex` | Month | 月度视图 |
| `/year` | Year | 年度总览 |
| `/summary` | Summary | 日/周/月/年总结 |

## 数据层

**双数据库服务**：
- `src/services/database.js` → `db` - 底层直连，RPC 调用
- `src/services/safeDb.js` → `safeDb` - 封装版，失败时自动 toast 错误提示；**Direction 模块统一使用 safeDb**

**Supabase 扩展**：`supabase.createBase(tableName)` 生成标准 CRUD 对象（list/getById/create/update/delete/query）。

**数据库 Schema**：`database/schema.sql`，所有表配置了 RLS 策略保证用户数据隔离。

### RPC 批量操作

Direction 模块通过 RPC 实现高性能批量操作：
- `batch_upsert_daily_plans` - 批量新增/更新每日任务
- `batch_delete_daily_plans` - 批量删除指定日期的任务

## 状态管理

- `src/stores/authStore.js` - 用户认证（persist: true）
- `src/stores/dateStore.js` - 日期状态
- `src/stores/uiStore.js` - UI 状态
- `src/stores/pomodoroStore.js` - 番茄钟状态

## Composables 模式

视图级逻辑抽到 `src/views/[module]/composables/` 下。**业务逻辑必须通过 Composables 引入**，不在组件内部直接处理核心逻辑。共享状态通过 `useDirectionState.js` 等状态定义文件在 composables 之间传递。

## Vue 3 组件规范

1. **使用 `<script setup>` 语法**，结构顺序：template → script → style
2. **核心逻辑通过 Composables 引入**，组件只处理 UI 和状态展示
3. **样式用 Tailwind**，公共样式提取到 `<style scoped>` 用 `@apply`，不在 template 内堆 class
4. **组件单一职责**，超过 300 行考虑拆分
5. **文件引入用 `@` 路径别名**

## Tailwind CSS 4

主题配置在 `src/assets/tw-theme.css`，使用 `@theme inline` 定义设计 token，支持 light/dark 双主题。

## 路由守卫

`src/router/index.js` 的 `beforeEach` 依据 `authStore.userId` 判断登录状态，未登录重定向 `/login`。

## 模块文档

详细模块说明见 `docs/modules/` 目录：direction、day、habits、summary、month-year、login、app、framework、common、ui-components。