# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 生产构建
pnpm preview          # 预览生产构建
pnpm test:unit        # 运行所有 Vitest 测试
pnpm vitest run path  # 运行单个测试文件
```

环境变量：复制 `.env.example` 为 `.env`，填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_KEY`。

注意：项目没有配置 ESLint / Prettier / Husky，不依赖格式化工具。

## 技术栈

- **Vue 3** (Composition API + `<script setup>`)
- **Vite 7** + Tailwind CSS 4 (CSS-first，无 `tailwind.config.js`，通过 `@theme inline` 定义 design tokens)
- **Pinia** (状态管理，authStore 启用了 persist 持久化)
- **Supabase** (PostgreSQL + Row Level Security)
- **VueUse** + **Radix Vue** + **Reka UI**
- **JavaScript** (仅 `src/lib/utils.ts` 一个 TS 文件)

## 视图体系

| 路由 | 模块 | 说明 |
|------|------|------|
| `/direction` | Direction | 长期目标管理，三级级联：goal → goal_months → goal_days |
| `/habits` | Habits | 周期行为追踪，热力图日历 + 数据统计 |
| `/day/:year/:month/:day` | Timeline | 每日时间轴，统一聚合 Task、GoalDay、Habit 三种数据源 |
| `/month/:year/:month` | Month | 月度视图 |
| `/year/:year` | Year | 年度总览 |
| `/summary` | Summary | 日/周/月/年总结 |

## 数据层

**数据库服务**：`src/services/database.js` 导出 `db` 对象，汇总 `src/services/db/` 下每个表模块（goal、goalMonths、goalDays、habit、task、summary、goalCategories、dailyReportLog）。

每个表模块通过 `supabase.createBase(tableName)` 生成标准 CRUD 对象（list/getById/create/update/delete/query），额外方法（如 habit 的 listLogsByDate）在对应模块内扩展。

`db.rpc(name, params)` 可直接调用 Supabase PostgreSQL 函数。

**数据库真相源**：以 Supabase MCP 查询到的线上真实结构为准，本地快照见 `database/current-structure.md`。

### RPC 批量操作

Direction 模块通过 RPC 实现高性能批量操作：
- `batch_upsert_daily_plans` - 批量新增/更新每日任务
- `batch_delete_daily_plans` - 批量删除指定日期的任务

## 全局加载

`src/composables/useGlobalLoading.js` 通过 NProgress 提供全局加载状态，含 200ms 延迟显示和 300ms 最小可见时间，路由切换自动触发。

## 状态管理

- `src/stores/authStore.js` - 用户认证（persist: true）
- `src/stores/dateStore.js` - 日期状态
- `src/stores/uiStore.js` - UI 状态
- `src/stores/pomodoroStore.js` - 番茄钟状态
- `src/stores/onboardingStore.js` - 新用户引导
- `src/stores/pageStateStore.js` - 各视图临时 UI 状态

## Composables 模式

视图级逻辑抽到 `src/views/[module]/composables/` 下。**业务逻辑必须通过 Composables 引入**，不在组件内部直接处理核心逻辑。

共享 composables 位于 `src/composables/`：useMobile、useResizable、useNotifications、useGlobalLoading、useToast。

## Vue 3 组件规范

1. **使用 `<script setup>` 语法**，结构顺序：template → script → style
2. **核心逻辑通过 Composables 引入**，组件只处理 UI 和状态展示
3. **样式用 Tailwind**，公共样式提取到 `<style scoped>` 用 `@apply`，不在 template 内堆 class
4. **组件单一职责**，超过 300 行考虑拆分
5. **文件引入用 `@` 路径别名**

## 注释规范

适当写注释，不需要太多。在每个逻辑段落处简要说明该段做什么即可，不要写多行文档块或逐行解释。

## 工具函数

- `src/lib/utils.ts` — `cn(...inputs)` = `clsx` + `tailwind-merge`，用于合并 className
- `src/utils/dateFormatter.js` — 日期格式化、范围计算、月份名称
- `src/utils/goalDayStatus.js` — goal_days status 与布尔值互转
- `src/utils/throttle.js` — `throttle(fn, delay)` 和 `withLoadingLock(asyncFn)`
- `src/utils/audio.js` — `playSuccessSound()` 播放完成音效

## Tailwind CSS 4

主题配置在 `src/assets/tw-theme.css`，使用 `@theme inline` 定义设计 token，支持 light/dark 双主题。组件样式文件用 `@reference "@/assets/tw-theme.css"` 引用主题变量。

## 路由守卫

`src/router/index.js` 的 `beforeEach` 依据 `authStore.userId` 判断登录状态，未登录重定向 `/login`。

## 模块文档

详细模块说明见 `docs/modules/` 目录：direction、day、habits、summary、month-year、login、app、framework、common、ui-components。

## 用户偏好

- **Git 提交**：实现计划执行完成后，不要执行 git commit，所有代码编写完毕后最后一起提交
