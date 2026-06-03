# AGENTS.md

**代理必须信任本文件中的指令，仅在信息不完整时才进行搜索。**

---

## 项目概况

- 项目名称：`rhythm`
- 前端框架：Vue 3（Composition API + `<script setup>`）
- 构建工具：Vite 7
- 样式体系：Tailwind CSS 4（设计令牌在 `src/assets/tw-theme.css`）
- 状态管理：Pinia（`authStore` 启用持久化）
- 数据服务：Supabase
- UI / 工具库：VueUse、Radix Vue、Reka UI
- 语言现状：JavaScript 为主，配合 TypeScript 工具链

### 常用命令

```bash
pnpm dev       # 启动开发服务器（修改代码后自动热更新）
pnpm build     # 生产构建（用于验证打包是否正常）
pnpm preview   # 预览生产构建
pnpm vue-tsc   # TypeScript 类型检查（提交前必须通过）
```

### 环境变量

复制 `.env.example` 为 `.env`，填入：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

---

## 关键目录结构

```
src/
├── assets/              # 静态资源、主题配置
│   └── tw-theme.css     # Tailwind 主题定义
├── composables/         # 全局可复用逻辑
├── components/          # 全局通用组件
├── router/              # 路由配置与守卫
│   └── index.js         # 路由守卫逻辑
├── services/            # 数据库访问服务
│   ├── database.js      # 底层直连与 RPC
│   └── safeDb.js        # 带 toast 提示的安全封装
├── stores/              # Pinia 状态管理
│   ├── authStore.js     # 用户认证（persist: true）
│   ├── dateStore.js     # 日期状态
│   ├── uiStore.js       # 界面状态
│   └── pomodoroStore.js # 番茄钟状态
└── views/               # 页面视图
    ├── [module]/        # 各业务模块
    │   ├── composables/ # 模块专属逻辑
    │   └── *.vue        # 页面组件
    └── ...
```

---

## 架构约定

### 路由与模块

| 路由 | 模块 | 说明 |
|------|------|------|
| `/direction` | Direction | 长期目标管理，三级级联：`plans → monthly_plans → daily_plans` |
| `/habits` | Habits | 周期行为追踪，包含热力图日历与数据统计 |
| `/day/:year/:month/:day` | Timeline | 每日时间轴，聚合 Task、DailyPlan、Habit 三种数据源 |
| `/month/:year/:month` | Month | 月度视图 |
| `/year/:year` | Year | 年度总览 |
| `/summary` | Summary | 日 / 周 / 月 / 年总结 |

模块文档位于 `docs/modules/`。

### 数据层

| 文件 | 导出 | 用途 |
|------|------|------|
| `src/services/database.js` | `db` | 底层直连与 RPC 调用 |
| `src/services/safeDb.js` | `safeDb` | 失败时自动 toast，Direction 模块统一使用 |

- `supabase.createBase(tableName)` 生成标准 CRUD 对象
- 标准能力：`list`、`getById`、`create`、`update`、`delete`、`query`
- 数据库真相源：以 Supabase MCP 查询到的线上真实结构为准
- Direction 模块 RPC：`batch_upsert_daily_plans`、`batch_delete_daily_plans`

### 路由守卫

- 路由守卫位于 `src/router/index.js`
- `beforeEach` 依据 `authStore.userId` 判断登录状态
- 未登录用户统一重定向到 `/login`
- 涉及登录态、跳转控制的改动，必须同步检查：路由守卫、`authStore` 数据流、页面初始化依赖

---

## 代码规范

### 通用原则

- **绝对不重复写轮子**：修改或新增功能前，必须先排查仓库内是否有可复用的代码、Composable、组件或工具函数，同时检查是否有成熟的第三方库可以解决，确认不存在后才考虑自行实现
- 使用 `<script setup>` 语法
- 文件结构：`template → script → style`
- 核心业务逻辑放入 `src/views/[module]/composables/`，组件只负责 UI 和状态展示
- 组件保持单一职责，模板超过 200 行时拆分子组件
- 导入路径统一使用 `@/` 别名

### 代码注释要求

注释写在代码上方，简短说明职责、业务含义或实现原因。重点覆盖：页面结构块、状态定义、函数职责、边界处理、非显而易见的副作用、潜在陷阱。

**template 注释：** 每个主要结构块写开始和结束注释

```vue
<!-- 搜索区开始 -->
<ContentWrap>
  <el-form :model="queryParams">...</el-form>
</ContentWrap>
<!-- 搜索区结束 -->
```

**script 注释：** 每个状态变量、每个函数必须加注释

```ts
// 表格加载状态，用于控制重复请求和 loading 展示
const loading = ref(false)

// 页面初始化和查询条件变化时拉取列表数据
const getList = async () => {
  // 请求发出前锁定，防止重复提交
  loading.value = true
  try {
    const data = await DemoApi.getDemoPage(queryParams)
    list.value = data.list
  } finally {
    // 请求结束后释放锁定，确保异常场景也能恢复按钮状态
    loading.value = false
  }
}
```

**行内注释对比：**

```ts
// Bad: // 过滤字段
list.filter(f => f.id !== fieldId)

// Good: filter 返回新数组，确保引用变化触发响应式更新
list.filter(f => f.id !== fieldId)
```

---

## 代理执行规则

### Git 偏好

- 实现计划执行过程中，不要提前提交 commit
- 所有代码编写完成后，再统一进行提交
- 由用户执行最终提交，代理不执行 `git commit`

### 代理协作偏好

- 方案、计划、总结优先沉淀到仓库文档，不只保留在对话中
- 如果新增计划文档，使用中文编写，文件名使用中文
- 计划文档需要明确目录、文件、改动点和影响范围，避免模糊表达
- 修改前先理解对应模块文档、数据流和 Composable 入口，避免直接在组件表层修补

---

## 常见错误与反模式

| 错误类型 | 错误做法 | 正确做法 |
|----------|----------|----------|
| 重复造轮子 | 手写日期工具函数 | 使用 VueUse 的 `useDateFns` 等已有封装 |
| 组件臃肿 | 300+ 行单文件组件 | 拆分为子组件 + Composables |
| 样式冲突 | 硬编码颜色值 `#fff` | 使用 Tailwind token `bg-white` |
| 响应式丢失 | 直接修改 reactive 属性 | 使用解构后赋值或 `Object.assign` |
| 状态分散 | 逻辑散落在多个组件 | 收敛到 `composables/` 统一管理 |
| 忽略类型 | 跳过 `vue-tsc` 检查 | 提交前必须通过类型检查 |

---

## 工作流指导

### 修改前

1. 阅读对应模块的 `docs/modules/` 文档
2. 检查 `composables/` 是否有可复用逻辑
3. 检查 `components/` 是否有可复用组件
4. 理解数据流和状态管理方式

### 修改中

- 每次改动尽量小且聚焦，便于验证
- 新增功能优先复用现有代码和第三方库
- 保持组件职责单一，复杂逻辑抽取到 Composable

### 修改后

- 运行 `pnpm vue-tsc` 确认类型检查通过
- 运行 `pnpm build` 确认打包正常
- 验证功能在浏览器中正常工作
