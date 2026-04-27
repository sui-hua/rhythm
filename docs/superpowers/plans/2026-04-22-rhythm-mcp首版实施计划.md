# Rhythm MCP 首版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `D:\司占锋\demo\rhythm-mcp` 中实现一个可被 Claude / Hermes 通过 `stdio` 启动的 Rhythm MCP Server，支持今日总览、今日任务、今日日计划、今日习惯以及三个完成动作。

**Architecture:** 服务端作为独立 Node.js 项目存在，不直接复用前端运行时。配置层负责读取 Supabase 连接参数与 JWT，核心层负责日期与错误封装，工具层分别实现 7 个 MCP 工具，`stdio` 入口层只负责注册工具和启动 transport。

**Tech Stack:** Node.js、TypeScript、`@modelcontextprotocol/sdk`、`@supabase/supabase-js`、Vitest

---

## 文件结构

本次实现将创建和修改以下文件：

- 创建：`D:\司占锋\demo\rhythm-mcp\package.json`
- 创建：`D:\司占锋\demo\rhythm-mcp\tsconfig.json`
- 创建：`D:\司占锋\demo\rhythm-mcp\.gitignore`
- 创建：`D:\司占锋\demo\rhythm-mcp\.env.example`
- 创建：`D:\司占锋\demo\rhythm-mcp\README.md`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\config\env.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\core\dates.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\core\errors.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\core\result.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\core\supabase.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\core\queries.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\getTodayTasks.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\getTodayDailyPlans.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\getTodayHabits.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\getTodayOverview.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\completeTask.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\completeDailyPlan.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\completeHabit.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\index.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\server\stdio.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\index.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\__tests__\env.spec.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\__tests__\dates.spec.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\__tests__\getTodayOverview.spec.ts`
- 创建：`D:\司占锋\demo\rhythm-mcp\src\tools\__tests__\completeHabit.spec.ts`

职责约束如下：

- `src/config/env.ts`：只负责读取、校验、导出配置
- `src/core/dates.ts`：只负责“今天”的日期边界与日期字符串生成
- `src/core/errors.ts`：只负责统一业务错误类型与转译
- `src/core/result.ts`：只负责构造统一 `{ success, message, data }` 返回格式
- `src/core/supabase.ts`：只负责创建带 JWT 的 Supabase client
- `src/core/queries.ts`：只负责封装查询 today tasks / daily plans / habits 的共享逻辑
- `src/tools/*`：每个文件只实现一个 MCP 工具
- `src/server/stdio.ts`：只负责 server 初始化、schema 注册、tool 绑定

### Task 1: 初始化项目骨架

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\package.json`
- Create: `D:\司占锋\demo\rhythm-mcp\tsconfig.json`
- Create: `D:\司占锋\demo\rhythm-mcp\.gitignore`
- Create: `D:\司占锋\demo\rhythm-mcp\src\index.ts`

- [ ] **Step 1: 写出骨架配置的失败预期**

在计划执行前，先明确脚本与入口必须满足这些断言：

```json
{
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/index.ts",
    "test": "vitest run"
  }
}
```

入口文件必须能够从 `src/index.ts` 导出并启动 `stdio` server，否则后续 Claude / Hermes 无法接入。

- [ ] **Step 2: 创建 `package.json`**

写入以下最小内容：

```json
{
  "name": "rhythm-mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.4",
    "@supabase/supabase-js": "^2.90.1",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/node": "^24.7.2",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 3: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: 创建 `.gitignore` 和占位入口**

`.gitignore`：

```gitignore
node_modules
dist
.env
```

`src/index.ts`：

```ts
export async function main() {
    throw new Error('Server bootstrap not implemented yet.')
}

void main()
```

- [ ] **Step 5: 运行构建验证骨架可编译**

Run: `npm install`

Expected: 安装成功并生成 `package-lock.json`

Run: `npm run build`

Expected: FAIL，报错来自未实现的 server 依赖尚未创建，但 TypeScript 配置本身有效

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore src/index.ts
git commit -m "chore: scaffold rhythm mcp project"
```

### Task 2: 配置层与日期工具

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\src\config\env.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\core\dates.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\__tests__\env.spec.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\__tests__\dates.spec.ts`

- [ ] **Step 1: 先写配置读取失败测试**

```ts
import { describe, expect, it } from 'vitest'
import { loadEnv } from '../config/env'

describe('loadEnv', () => {
    it('throws when required env vars are missing', () => {
        expect(() =>
            loadEnv({
                SUPABASE_URL: '',
                SUPABASE_ANON_KEY: '',
                SUPABASE_JWT: ''
            })
        ).toThrow('Missing required environment variable: SUPABASE_URL')
    })
})
```

- [ ] **Step 2: 写日期边界测试**

```ts
import { describe, expect, it } from 'vitest'
import { getTodayRange, getDateKey } from '../core/dates'

describe('dates', () => {
    it('builds a date key in YYYY-MM-DD format', () => {
        expect(getDateKey(new Date('2026-04-22T08:30:00+08:00'))).toBe('2026-04-22')
    })

    it('builds inclusive today range', () => {
        const { start, end } = getTodayRange(new Date('2026-04-22T08:30:00+08:00'))
        expect(start.toISOString()).toBe('2026-04-21T16:00:00.000Z')
        expect(end.toISOString()).toBe('2026-04-22T15:59:59.999Z')
    })
})
```

- [ ] **Step 3: 实现 `src/config/env.ts`**

```ts
export interface EnvShape {
    SUPABASE_URL?: string
    SUPABASE_ANON_KEY?: string
    SUPABASE_JWT?: string
    TZ?: string
}

export interface AppEnv {
    supabaseUrl: string
    supabaseAnonKey: string
    supabaseJwt: string
    timeZone: string
}

export function loadEnv(source: EnvShape = process.env): AppEnv {
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_JWT'] as const

    for (const key of required) {
        if (!source[key]?.trim()) {
            throw new Error(`Missing required environment variable: ${key}`)
        }
    }

    return {
        supabaseUrl: source.SUPABASE_URL!.trim(),
        supabaseAnonKey: source.SUPABASE_ANON_KEY!.trim(),
        supabaseJwt: source.SUPABASE_JWT!.trim(),
        timeZone: source.TZ?.trim() || 'Asia/Shanghai'
    }
}
```

- [ ] **Step 4: 实现 `src/core/dates.ts`**

```ts
export interface TodayRange {
    start: Date
    end: Date
}

export function getDateKey(input: Date): string {
    const year = input.getFullYear()
    const month = String(input.getMonth() + 1).padStart(2, '0')
    const day = String(input.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function getTodayRange(now: Date = new Date()): TodayRange {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    return { start, end }
}
```

- [ ] **Step 5: 运行单测**

Run: `npm test -- --run src/__tests__/env.spec.ts src/__tests__/dates.spec.ts`

Expected: PASS，2 个测试文件全部通过

- [ ] **Step 6: Commit**

```bash
git add src/config/env.ts src/core/dates.ts src/__tests__/env.spec.ts src/__tests__/dates.spec.ts
git commit -m "feat: add config and date utilities"
```

### Task 3: 统一结果、错误和 Supabase Client

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\src\core\errors.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\core\result.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\core\supabase.ts`

- [ ] **Step 1: 设计统一返回对象**

```ts
export interface ToolSuccess<T> {
    success: true
    message: string
    data: T
}

export interface ToolFailure {
    success: false
    message: string
    data: Record<string, never>
}
```

- [ ] **Step 2: 实现 `src/core/result.ts`**

```ts
export function ok<T>(message: string, data: T) {
    return { success: true as const, message, data }
}

export function fail(message: string) {
    return { success: false as const, message, data: {} }
}
```

- [ ] **Step 3: 实现 `src/core/errors.ts`**

```ts
export class AppError extends Error {
    constructor(
        message: string,
        public readonly code:
            | 'CONFIG_ERROR'
            | 'AUTH_ERROR'
            | 'VALIDATION_ERROR'
            | 'DATABASE_ERROR'
    ) {
        super(message)
        this.name = 'AppError'
    }
}

export function toUserMessage(error: unknown): string {
    if (error instanceof AppError) return error.message
    if (error instanceof Error) return error.message
    return 'Unknown server error.'
}
```

- [ ] **Step 4: 实现 `src/core/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'
import type { AppEnv } from '../config/env'

export function createAuthorizedSupabaseClient(env: AppEnv) {
    return createClient(env.supabaseUrl, env.supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${env.supabaseJwt}`
            }
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    })
}
```

- [ ] **Step 5: 运行构建**

Run: `npm run build`

Expected: FAIL，如果报错集中在未创建的 tool / server 文件，说明当前核心文件类型正确

- [ ] **Step 6: Commit**

```bash
git add src/core/errors.ts src/core/result.ts src/core/supabase.ts
git commit -m "feat: add shared server core utilities"
```

### Task 4: 查询共享逻辑与 3 个查询工具

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\src\core\queries.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\getTodayTasks.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\getTodayDailyPlans.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\getTodayHabits.ts`

- [ ] **Step 1: 先定义共享查询函数签名**

```ts
export async function fetchTodayTasks(/* ... */) {}
export async function fetchTodayDailyPlans(/* ... */) {}
export async function fetchTodayHabits(/* ... */) {}
```

这些函数要隐藏表结构细节，让 `tools/*` 只负责返回 MCP 结果。

- [ ] **Step 2: 实现 `src/core/queries.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from './errors'
import { getDateKey, getTodayRange } from './dates'

export async function fetchTodayTasks(client: SupabaseClient, now = new Date()) {
    const { start, end } = getTodayRange(now)
    const { data, error } = await client
        .from('tasks')
        .select('id, title, status, start_time, end_time, created_at, updated_at')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true })

    if (error) throw new AppError('Failed to load today tasks.', 'DATABASE_ERROR')
    return data ?? []
}

export async function fetchTodayDailyPlans(client: SupabaseClient, now = new Date()) {
    const dateKey = getDateKey(now)
    const { data, error } = await client
        .from('daily_plans')
        .select('id, day, task_time, duration, content, status, monthly_plan_id')
        .eq('day', dateKey)
        .order('task_time', { ascending: true })

    if (error) throw new AppError('Failed to load today daily plans.', 'DATABASE_ERROR')
    return data ?? []
}

export async function fetchTodayHabits(client: SupabaseClient, now = new Date()) {
    const { start, end } = getTodayRange(now)
    const [{ data: habits, error: habitsError }, { data: logs, error: logsError }] = await Promise.all([
        client.from('habits').select('id, name, created_at').order('created_at', { ascending: true }),
        client
            .from('habit_logs')
            .select('id, habit_id, completed_at')
            .gte('completed_at', start.toISOString())
            .lte('completed_at', end.toISOString())
    ])

    if (habitsError || logsError) throw new AppError('Failed to load today habits.', 'DATABASE_ERROR')

    const logByHabitId = new Map((logs ?? []).map(log => [String(log.habit_id), log]))
    return (habits ?? []).map(habit => ({
        ...habit,
        completed_today: logByHabitId.has(String(habit.id)),
        today_log_id: logByHabitId.get(String(habit.id))?.id ?? null
    }))
}
```

- [ ] **Step 3: 实现 `src/tools/getTodayTasks.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { ok } from '../core/result'
import { fetchTodayTasks } from '../core/queries'

export async function getTodayTasks(client: SupabaseClient) {
    const tasks = await fetchTodayTasks(client)
    return ok(`Loaded ${tasks.length} tasks for today.`, { tasks })
}
```

- [ ] **Step 4: 实现 `src/tools/getTodayDailyPlans.ts` 和 `src/tools/getTodayHabits.ts`**

```ts
export async function getTodayDailyPlans(client: SupabaseClient) {
    const dailyPlans = await fetchTodayDailyPlans(client)
    return ok(`Loaded ${dailyPlans.length} daily plans for today.`, { dailyPlans })
}
```

```ts
export async function getTodayHabits(client: SupabaseClient) {
    const habits = await fetchTodayHabits(client)
    return ok(`Loaded ${habits.length} habits for today.`, { habits })
}
```

- [ ] **Step 5: 运行构建**

Run: `npm run build`

Expected: FAIL，若剩余错误只来自 overview / complete / server 未实现，则说明查询工具层类型通过

- [ ] **Step 6: Commit**

```bash
git add src/core/queries.ts src/tools/getTodayTasks.ts src/tools/getTodayDailyPlans.ts src/tools/getTodayHabits.ts
git commit -m "feat: add today query tools"
```

### Task 5: 总览工具与计数结构

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\getTodayOverview.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\__tests__\getTodayOverview.spec.ts`

- [ ] **Step 1: 写总览计数测试**

```ts
import { describe, expect, it } from 'vitest'
import { buildOverviewData } from '../getTodayOverview'

describe('buildOverviewData', () => {
    it('builds symmetric count blocks', () => {
        const result = buildOverviewData(
            [{ id: '1', status: 'completed' }, { id: '2', status: 'pending' }],
            [{ id: '3', status: 'completed' }],
            [{ id: '4', completed_today: true }, { id: '5', completed_today: false }]
        )

        expect(result.counts).toEqual({
            tasks: { total: 2, completed: 1 },
            dailyPlans: { total: 1, completed: 1 },
            habits: { total: 2, completed: 1 }
        })
    })
})
```

- [ ] **Step 2: 实现 `src/tools/getTodayOverview.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchTodayDailyPlans, fetchTodayHabits, fetchTodayTasks } from '../core/queries'
import { ok } from '../core/result'

export function buildOverviewData(tasks: any[], dailyPlans: any[], habits: any[]) {
    return {
        tasks,
        dailyPlans,
        habits,
        counts: {
            tasks: {
                total: tasks.length,
                completed: tasks.filter(task => task.status === 'completed').length
            },
            dailyPlans: {
                total: dailyPlans.length,
                completed: dailyPlans.filter(plan => plan.status === 'completed').length
            },
            habits: {
                total: habits.length,
                completed: habits.filter(habit => habit.completed_today).length
            }
        }
    }
}

export async function getTodayOverview(client: SupabaseClient) {
    const [tasks, dailyPlans, habits] = await Promise.all([
        fetchTodayTasks(client),
        fetchTodayDailyPlans(client),
        fetchTodayHabits(client)
    ])

    return ok('Loaded today overview.', buildOverviewData(tasks, dailyPlans, habits))
}
```

- [ ] **Step 3: 运行总览测试**

Run: `npm test -- --run src/tools/__tests__/getTodayOverview.spec.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/tools/getTodayOverview.ts src/tools/__tests__/getTodayOverview.spec.ts
git commit -m "feat: add today overview tool"
```

### Task 6: 完成任务与完成日计划工具

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\completeTask.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\completeDailyPlan.ts`

- [ ] **Step 1: 约定两个完成工具的最小输入**

```ts
type CompleteTaskInput = { task_id: string }
type CompleteDailyPlanInput = { daily_plan_id: string }
```

- [ ] **Step 2: 实现 `src/tools/completeTask.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../core/errors'
import { ok } from '../core/result'

export async function completeTask(client: SupabaseClient, input: { task_id: string }) {
    if (!input.task_id?.trim()) {
        throw new AppError('Missing required parameter: task_id', 'VALIDATION_ERROR')
    }

    const { data, error } = await client
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', input.task_id)
        .select('id, title, status')
        .single()

    if (error) throw new AppError('Failed to complete task.', 'DATABASE_ERROR')
    return ok('Task completed.', { task: data })
}
```

- [ ] **Step 3: 实现 `src/tools/completeDailyPlan.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../core/errors'
import { ok } from '../core/result'

export async function completeDailyPlan(client: SupabaseClient, input: { daily_plan_id: string }) {
    if (!input.daily_plan_id?.trim()) {
        throw new AppError('Missing required parameter: daily_plan_id', 'VALIDATION_ERROR')
    }

    const { data, error } = await client
        .from('daily_plans')
        .update({ status: 'completed' })
        .eq('id', input.daily_plan_id)
        .select('id, content, status')
        .single()

    if (error) throw new AppError('Failed to complete daily plan.', 'DATABASE_ERROR')
    return ok('Daily plan completed.', { dailyPlan: data })
}
```

- [ ] **Step 4: 运行构建**

Run: `npm run build`

Expected: FAIL，如果剩余错误仅来自 completeHabit / server / tool index，则当前两个完成工具已接通

- [ ] **Step 5: Commit**

```bash
git add src/tools/completeTask.ts src/tools/completeDailyPlan.ts
git commit -m "feat: add completion tools for tasks and daily plans"
```

### Task 7: 完成习惯工具与重复打卡保护

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\completeHabit.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\__tests__\completeHabit.spec.ts`

- [ ] **Step 1: 写重复打卡保护测试**

```ts
import { describe, expect, it } from 'vitest'
import { ensureHabitNotCompletedToday } from '../completeHabit'

describe('ensureHabitNotCompletedToday', () => {
    it('throws when the habit already has a log for today', () => {
        expect(() =>
            ensureHabitNotCompletedToday([{ id: 'log-1', habit_id: 'habit-1' }], 'habit-1')
        ).toThrow('Habit already completed today.')
    })
})
```

- [ ] **Step 2: 实现 `src/tools/completeHabit.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../core/errors'
import { getTodayRange } from '../core/dates'
import { ok } from '../core/result'

export function ensureHabitNotCompletedToday(logs: Array<{ habit_id: string }>, habitId: string) {
    const alreadyCompleted = logs.some(log => String(log.habit_id) === String(habitId))
    if (alreadyCompleted) {
        throw new AppError('Habit already completed today.', 'VALIDATION_ERROR')
    }
}

export async function completeHabit(client: SupabaseClient, input: { habit_id: string }, now = new Date()) {
    if (!input.habit_id?.trim()) {
        throw new AppError('Missing required parameter: habit_id', 'VALIDATION_ERROR')
    }

    const { start, end } = getTodayRange(now)
    const { data: logs, error: logsError } = await client
        .from('habit_logs')
        .select('id, habit_id')
        .eq('habit_id', input.habit_id)
        .gte('completed_at', start.toISOString())
        .lte('completed_at', end.toISOString())

    if (logsError) throw new AppError('Failed to validate habit completion.', 'DATABASE_ERROR')

    ensureHabitNotCompletedToday(logs ?? [], input.habit_id)

    const { data, error } = await client
        .from('habit_logs')
        .insert({ habit_id: input.habit_id })
        .select('id, habit_id, completed_at')
        .single()

    if (error) throw new AppError('Failed to complete habit.', 'DATABASE_ERROR')
    return ok('Habit completed.', { habitLog: data })
}
```

- [ ] **Step 3: 运行习惯测试**

Run: `npm test -- --run src/tools/__tests__/completeHabit.spec.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/tools/completeHabit.ts src/tools/__tests__/completeHabit.spec.ts
git commit -m "feat: add habit completion tool"
```

### Task 8: MCP 工具注册与 `stdio` 入口

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\src\tools\index.ts`
- Create: `D:\司占锋\demo\rhythm-mcp\src\server\stdio.ts`
- Modify: `D:\司占锋\demo\rhythm-mcp\src\index.ts`

- [ ] **Step 1: 汇总工具导出**

`src/tools/index.ts`：

```ts
export { getTodayOverview } from './getTodayOverview'
export { getTodayTasks } from './getTodayTasks'
export { getTodayDailyPlans } from './getTodayDailyPlans'
export { getTodayHabits } from './getTodayHabits'
export { completeTask } from './completeTask'
export { completeDailyPlan } from './completeDailyPlan'
export { completeHabit } from './completeHabit'
```

- [ ] **Step 2: 实现 `src/server/stdio.ts`**

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { loadEnv } from '../config/env'
import { toUserMessage } from '../core/errors'
import { createAuthorizedSupabaseClient } from '../core/supabase'
import {
    completeDailyPlan,
    completeHabit,
    completeTask,
    getTodayDailyPlans,
    getTodayHabits,
    getTodayOverview,
    getTodayTasks
} from '../tools'

export async function startStdioServer() {
    const env = loadEnv()
    const client = createAuthorizedSupabaseClient(env)
    const server = new McpServer({ name: 'rhythm-mcp', version: '0.1.0' })

    server.tool('get_today_overview', async () => ({ content: [{ type: 'text', text: JSON.stringify(await getTodayOverview(client)) }] }))
    server.tool('get_today_tasks', async () => ({ content: [{ type: 'text', text: JSON.stringify(await getTodayTasks(client)) }] }))
    server.tool('get_today_daily_plans', async () => ({ content: [{ type: 'text', text: JSON.stringify(await getTodayDailyPlans(client)) }] }))
    server.tool('get_today_habits', async () => ({ content: [{ type: 'text', text: JSON.stringify(await getTodayHabits(client)) }] }))
    server.tool('complete_task', { task_id: z.string() }, async input => ({ content: [{ type: 'text', text: JSON.stringify(await completeTask(client, input)) }] }))
    server.tool('complete_daily_plan', { daily_plan_id: z.string() }, async input => ({ content: [{ type: 'text', text: JSON.stringify(await completeDailyPlan(client, input)) }] }))
    server.tool('complete_habit', { habit_id: z.string() }, async input => ({ content: [{ type: 'text', text: JSON.stringify(await completeHabit(client, input)) }] }))

    const transport = new StdioServerTransport()
    await server.connect(transport)
}
```

- [ ] **Step 3: 给 `src/index.ts` 接上启动逻辑和顶层错误处理**

```ts
import { startStdioServer } from './server/stdio'

export async function main() {
    await startStdioServer()
}

main().catch(error => {
    const message = error instanceof Error ? error.message : 'Unknown startup error.'
    console.error(message)
    process.exitCode = 1
})
```

- [ ] **Step 4: 运行构建**

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tools/index.ts src/server/stdio.ts src/index.ts
git commit -m "feat: wire stdio server and tool registry"
```

### Task 9: 测试、文档与接入说明

**Files:**
- Create: `D:\司占锋\demo\rhythm-mcp\.env.example`
- Create: `D:\司占锋\demo\rhythm-mcp\README.md`

- [ ] **Step 1: 写 `.env.example`**

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT=your-user-jwt
TZ=Asia/Shanghai
```

- [ ] **Step 2: 写 `README.md`**

```md
# Rhythm MCP

## Scripts

- `npm run dev`
- `npm run build`
- `npm test`

## Environment

Copy `.env.example` to `.env` and fill in:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT`
- `TZ`

## Claude Desktop Example

```json
{
  "mcpServers": {
    "rhythm": {
      "command": "node",
      "args": ["D:/司占锋/demo/rhythm-mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_ANON_KEY": "...",
        "SUPABASE_JWT": "...",
        "TZ": "Asia/Shanghai"
      }
    }
  }
}
```
```

- [ ] **Step 3: 跑全量验证**

Run: `npm test`

Expected: PASS

Run: `npm run build`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add .env.example README.md
git commit -m "docs: add rhythm mcp setup instructions"
```

## 自检

- Spec coverage：已覆盖 `stdio` 入口、JWT + RLS、7 个工具、统一返回结构、错误处理、日期处理、最小测试与接入说明。
- Placeholder scan：计划中没有 `TODO`、`TBD` 或“自行实现”式占位描述。
- Type consistency：工具命名、参数名、`counts` 结构均与设计文档一致，使用 `complete_habit`、`complete_daily_plan`、`get_today_overview` 等最终命名。
