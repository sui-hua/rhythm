# 全站耗时加载动画设计稿（Global Loading Design）

- 日期：2026-04-15
- 状态：已完成设计评审（待实现）
- 适用范围：全站页面（含 `/day/:year/:month/:day`、`/direction`、`/habits`、`/year/:year`、`/month/:year/:month`、`/summary`、`/login`）

## 1. 目标与决策

本设计用于统一“所有耗时加载”的用户反馈，避免空白等待、无反馈和频繁闪烁。

已确认的产品决策：

1. 覆盖范围：全站页面
2. 反馈形态：组合方案（顶部进度条 + 局部骨架 + 按钮 loading）
3. 全局触发：仅慢请求触发（阈值 `>200ms`）
4. 首屏交互策略：轻阻塞（仅关键区域阻塞，不全屏封锁）

## 2. 架构与状态模型

加载体系按职责拆成三层：

1. Global Loading（全局慢请求感知）
- 作用：驱动顶部进度条
- 状态：`pendingCount`、`isVisible`、`showTimer`、`hideTimer`
- 规则：仅慢请求可见，显示后有最短可见时长

2. Page Loading（页面首屏/关键区域）
- 作用：驱动骨架屏，替代关键内容空白
- 状态：页面级 `isPageLoading`（各页面独立维护）
- 规则：仅关键区域轻阻塞，非关键区域保持可操作

3. Action Loading（交互提交态）
- 作用：写操作反馈 + 防重复点击
- 状态：`isSubmitting` / `loadingKey`
- 规则：成功/失败都必须恢复交互态

边界约束：
- 全局层只表达“有无慢请求”，不承载业务语义
- 页面层只表达“区域是否可渲染”
- 操作层只表达“当前动作是否进行中”

## 3. 数据流与触发矩阵

统一调用路径：
`View/Composable -> services/* -> config/supabase/createBase -> global loading tracker`

触发规则：

1. 读请求（`list/get/query`）
- `<200ms`：不显示全局进度条
- `>=200ms`：显示顶部进度条
- 首屏关键数据：叠加页面骨架

2. 写请求（`create/update/delete`）
- 主反馈为按钮 loading（禁用 + 进行中文案）
- 若写后触发大范围重拉数据，重拉阶段可触发顶部进度条与局部骨架

3. 并发请求
- 使用 `pendingCount` 控制可见性
- 仅在 `pendingCount === 0` 且满足最短可见时长后隐藏

4. 异常与结束
- 所有请求必须在 `finally` 归还计数
- 失败也必须收敛 loading，避免界面卡死

## 4. UI 行为规范

### 4.1 顶部进度条

- 位置：`App.vue` 顶部固定
- 样式：细条（1-2px），连续移动动画
- 触发：慢请求（`>200ms`）
- 收敛：无请求后延迟隐藏，最短展示 `300ms`
- 交互：`pointer-events: none`，不截获点击

### 4.2 页面骨架（轻阻塞）

- 首屏关键区域显示骨架，不使用全屏强遮罩
- 数据返回后平滑切换内容，避免布局跳变
- 仅阻塞正在加载的关键区块内部交互

### 4.3 按钮 loading

- 全部写操作入口必须接入
- 显示转圈 + 中文进行中文案（如 `保存中...`）
- 按钮禁用防重复提交
- 列表项操作优先“单项 loading”，避免整页锁死

### 4.4 A11y

- 全局进度区加 `aria-live="polite"`
- 按钮 loading 保留文本可读性，不仅依赖图标

## 5. 文件改动计划（实现指引）

1. 全局 loading 基础能力
- `src/composables/useGlobalLoading.js`

2. 数据层统一接入
- `src/config/supabase.js`
- `src/services/db/habits.js`（`habit_logs` 直连）
- `src/services/db/summaries.js`（`summaries` 直连）

3. 全局进度条组件与挂载
- `src/components/ui/GlobalLoadingBar.vue`
- `src/App.vue`

4. 页面骨架与交互态接入（全站批次推进）
- 第一批：`/day/:year/:month/:day`、`/direction`、`/habits`
- 第二批：`/year/:year`、`/month/:year/:month`、`/summary`、`/login`

## 6. 测试与验收标准（强制包含 Playwright-MCP）

本需求验收必须使用 `playwright-mcp` 执行自动化验证，不仅依赖手工测试。

最小测试集：

1. 慢请求（`>200ms`）出现顶部进度条并正确消失
2. 快请求（`<200ms`）不出现顶部进度条
3. `/day/:year/:month/:day`、`/direction`、`/habits` 首屏骨架出现并正确切换
4. 写操作按钮进入 loading 后禁用，结束后恢复
5. 并发请求下进度条不会提前消失
6. 失败请求后 loading 正常收敛，不发生界面卡死

回归要求：

- `pnpm build` 通过
- 路由转场与 loading 动画互不冲突
- 现有 toast 错误提示行为保持一致

## 7. 风险与回滚

风险：

1. 全局反馈过于频繁，造成视觉打扰
2. 并发计数错误导致进度条不消失
3. 页面骨架与真实内容布局不一致导致跳变

应对：

1. 严格执行 `>200ms` 阈值与 `300ms` 最短展示
2. 统一在 `finally` 扣减计数并添加兜底日志
3. 骨架按真实布局结构构建，禁止“通用灰块”乱用

回滚策略：

1. 保留全局 loading 开关（可快速关闭）
2. 优先回退全局进度条，不影响数据读写主流程
3. 页面骨架可逐页回滚，分批恢复稳定

