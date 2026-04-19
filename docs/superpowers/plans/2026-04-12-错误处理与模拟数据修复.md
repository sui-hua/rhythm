# 统一错误处理与假数据修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复三个模块的高优先级问题：统一错误处理（Toast）和假数据（Direction 65%、Habits 连击）

**Architecture:** SafeDb 包装层 + Toast 组件 + 假数据计算修复

**Tech Stack:** shadcn-vue toast, Vue 3 Composition API, Supabase

---

## 文件结构

```
src/
├── services/
│   ├── database.js           # 原始 db（不变）
│   └── safeDb.js           # 新增：包装 db，自动 toast 错误
├── composables/
│   └── useToast.js          # 新增：toast 使用工具
└── views/
    ├── day/composables/
    │   ├── useAddEventForm.js    # 修改：db → safeDb
    │   └── useDayData.js        # 修改：db → safeDb
    ├── habits/composables/
    │   ├── useHabitData.js      # 修改：db → safeDb + 连击计算修复
    │   └── useHabitLogs.js      # 修改：db → safeDb
    └── direction/composables/
        ├── useDirectionGoals.js  # 修改：db → safeDb
        └── useDirectionFetch.js  # 修改：db → safeDb
    └── direction/components/
        └── DirectionSidebar.vue  # 修改：65% 硬编码 → 真实计算
```

---

## 任务 1: 安装 Toast 组件

**Files:**
- Create: `src/components/ui/toast/Toaster.vue`
- Create: `src/components/ui/toast/use-toast.ts`
- Create: `src/components/ui/toast/toast.vue`
- Create: `src/components/ui/toast/index.ts`

- [ ] **Step 1: 运行 shadcn 安装命令**

```bash
cd /Users/sifan1/Documents/project/日程/rhythm
npx shadcn-vue@latest add toast
```

- [ ] **Step 2: 验证安装**

检查 `src/components/ui/toast/` 目录是否生成

---

## 任务 2: 创建 useToast Composable

**Files:**
- Create: `src/composables/useToast.js`

- [ ] **Step 1: 创建 useToast.js**

```javascript
import { toaster } from '@/components/ui/toast'

export function useToast() {
  const toast = {
    success: (message) => toaster.success(message, { duration: 3000 }),
    error: (message) => toaster.error(message, { duration: 3000 }),
    warning: (message) => toaster.warning(message, { duration: 3000 }),
    info: (message) => toaster.info(message, { duration: 3000 }),
  }

  return { toast }
}
```

- [ ] **Step 2: 在 App.vue 引入 Toaster**

找到 `src/App.vue`，在模板中添加：
```vue
<Toaster />
```

---

## 任务 3: 创建 SafeDb 包装

**Files:**
- Create: `src/services/safeDb.js`

- [ ] **Step 1: 创建 safeDb.js**

```javascript
import { db } from './database'
import { useToast } from '@/composables/useToast'

// 错误消息配置
const ERROR_MESSAGES = {
  plans: {
    list: '获取目标列表失败',
    create: '创建目标失败',
    update: '更新目标失败',
    delete: '删除目标失败',
  },
  tasks: {
    list: '获取任务列表失败',
    create: '创建任务失败',
    update: '更新任务失败',
    delete: '删除任务失败',
  },
  habits: {
    list: '获取习惯列表失败',
    create: '创建习惯失败',
    update: '更新习惯失败',
    delete: '删除习惯失败',
  },
  habit_logs: {
    create: '打卡失败',
    delete: '取消打卡失败',
  },
  dailyPlans: {
    list: '获取日计划失败',
    create: '创建日计划失败',
    update: '更新日计划失败',
    delete: '删除日计划失败',
  },
  monthlyPlans: {
    list: '获取月计划失败',
    create: '创建月计划失败',
    update: '更新月计划失败',
    delete: '删除月计划失败',
  },
  plansCategory: {
    list: '获取分类失败',
    create: '创建分类失败',
    update: '更新分类失败',
    delete: '删除分类失败',
  },
  summaries: {
    list: '获取总结失败',
    create: '创建总结失败',
    update: '更新总结失败',
    delete: '删除总结失败',
  },
  dailyReportViews: {
    create: '记录日报查看失败',
  },
}

// 包装单个方法
function wrapMethod(tableName, method, operation) {
  return async (...args) => {
    try {
      const result = await db[tableName][method](...args)
      return result
    } catch (e) {
      console.error(`[safeDb] ${tableName}.${method} failed:`, e)
      const { toast } = useToast()
      const msg = ERROR_MESSAGES[tableName]?.[operation] || '操作失败'
      toast.error(msg)
      return null
    }
  }
}

// 包装整个表
function wrapTable(tableName) {
  const operations = ['list', 'create', 'update', 'delete']
  const wrapped = {}

  for (const op of operations) {
    if (db[tableName] && typeof db[tableName][op] === 'function') {
      wrapped[op] = wrapMethod(tableName, op, op)
    }
  }

  return wrapped
}

// 创建 safeDb
export const safeDb = {
  plans: wrapTable('plans'),
  plansCategory: wrapTable('plansCategory'),
  monthlyPlans: wrapTable('monthlyPlans'),
  dailyPlans: wrapTable('dailyPlans'),
  habits: wrapTable('habits'),
  habit_logs: wrapTable('habit_logs'),
  tasks: wrapTable('tasks'),
  summaries: wrapTable('summaries'),
  dailyReportViews: wrapTable('dailyReportViews'),
}
```

---

## 任务 4: 修改 Day 模块 Composables

**Files:**
- Modify: `src/views/day/composables/useAddEventForm.js`
- Modify: `src/views/day/composables/useDayData.js`

- [ ] **Step 1: 修改 useAddEventForm.js - 导入 safeDb**

在文件顶部找到：
```javascript
import { db } from '@/services/database'
```

改为：
```javascript
import { safeDb as db } from '@/services/safeDb'
```

**注意**：删除所有 try-catch 中的 toast.error，因为 safeDb 已自动处理

- [ ] **Step 2: 修改 useDayData.js - 导入 safeDb**

同样将 `import { db }` 改为 `import { safeDb as db } from '@/services/safeDb'`

**注意**：检查 fetchTasks、handleToggleComplete 等方法，移除手动 toast 调用

---

## 任务 5: 修改 Habits 模块 Composables

**Files:**
- Modify: `src/views/habits/composables/useHabitData.js`
- Modify: `src/views/habits/composables/useHabitLogs.js`

- [ ] **Step 1: 修改 useHabitData.js - 导入 safeDb**

将 `import { db }` 改为 `import { safeDb as db } from '@/services/safeDb'`

- [ ] **Step 2: 修复 calculateStreak 函数**

找到 `useHabitData.js` 中的 `calculateStreak` 函数（约 L42-44），替换为：

```javascript
const calculateStreak = (logs) => {
  if (!logs || logs.length === 0) return 0

  // 按日期排序（最新的在前）
  const sortedDates = logs
    .map(log => new Date(log.completed_at).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index) // 去重
    .sort((a, b) => new Date(b) - new Date(a)) // 降序

  if (sortedDates.length === 0) return 0

  // 计算连续天数
  let streak = 0
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // 从今天或昨天开始计算
  const startDate = sortedDates[0] === today ? today :
                    sortedDates[0] === yesterday ? yesterday : null

  if (!startDate) return 0

  let currentDate = new Date(startDate)

  for (const dateStr of sortedDates) {
    const expected = currentDate.toDateString()
    if (dateStr === expected) {
      streak++
      currentDate = new Date(currentDate.getTime() - 86400000)
    } else if (new Date(dateStr) < currentDate) {
      break // 连击中断
    }
  }

  return streak
}
```

- [ ] **Step 3: 修改 useHabitLogs.js - 导入 safeDb**

将 `import { db }` 改为 `import { safeDb as db } from '@/services/safeDb'`

---

## 任务 6: 修改 Direction 模块 Composables

**Files:**
- Modify: `src/views/direction/composables/useDirectionGoals.js`
- Modify: `src/views/direction/composables/useDirectionFetch.js`

- [ ] **Step 1: 修改 useDirectionGoals.js - 导入 safeDb**

将 `import { db }` 改为 `import { safeDb as db } from '@/services/safeDb'`

- [ ] **Step 2: 修改 useDirectionFetch.js - 导入 safeDb**

将 `import { db }` 改为 `import { safeDb as db } from '@/services/safeDb'`

---

## 任务 7: 修复 Direction 65% 硬编码

**Files:**
- Modify: `src/views/direction/components/DirectionSidebar.vue`

- [ ] **Step 1: 添加导入**

在 `<script setup>` 顶部添加：

```javascript
import { monthlyPlans, dailyTasks } from '@/views/direction/composables/useDirectionState'
import { computed } from 'vue'
```

找到并修改：
```javascript
const { selectedGoal, selectGoal } = useDirectionSelection()
```

改为：
```javascript
const { selectedGoal, selectGoal, selectedMonth } = useDirectionSelection()
```

- [ ] **Step 2: 添加 systemLoad 计算属性**

在 `selectedGoalName` 计算属性后添加：

```javascript
// 计算系统推进负载：基于选中目标当前月份的日计划完成率
const systemLoad = computed(() => {
  if (!selectedGoal.value || !selectedMonth.value) return 0

  const planId = selectedGoal.value.plan_id
  const month = selectedMonth.value

  // 找到该目标当前月份的月度计划
  const monthPlan = monthlyPlans.value.find(
    mp => mp.plan_id === planId && new Date(mp.month).getMonth() + 1 === month
  )

  if (!monthPlan) return 0

  // 统计完成率
  const monthStr = String(month).padStart(2, '0')
  let total = 0
  let completed = 0

  Object.entries(dailyTasks).forEach(([key, task]) => {
    if (key.startsWith(`plan-${planId}-${monthStr}-`)) {
      total++
      if (task.status === 'completed') completed++
    }
  })

  return total === 0 ? 0 : Math.round((completed / total) * 100)
})
```

- [ ] **Step 3: 替换模板中的硬编码**

找到模板中：
```html
<span class="footer-value">65%</span>
<Progress :model-value="65" class="progress-bar" />
```

改为：
```html
<span class="footer-value">{{ systemLoad }}%</span>
<Progress :model-value="systemLoad" class="progress-bar" />
```

---

## 任务 8: 验证与测试

- [ ] **Step 1: 运行开发服务器**

```bash
pnpm dev
```

- [ ] **Step 2: 验证 Toast 组件**

在 Day 模块尝试一个操作（如添加任务），观察是否有 toast 提示

- [ ] **Step 3: 验证 Direction 负载显示**

进入 Direction 模块，检查侧边栏是否显示真实完成率

- [ ] **Step 4: 验证 Habits 连击计算**

创建习惯并连续打卡几天，检查统计数据中的连击数是否正确

---

## 任务 9: 提交代码

- [ ] **Step 1: 检查变更**

```bash
git status
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: 统一错误处理 + 假数据修复

- 添加 shadcn-vue toast 组件
- 创建 safeDb 包装层，自动 toast 错误
- 修改 Day/Habits/Direction composables 使用 safeDb
- 修复 Direction 侧边栏 65% 硬编码为真实完成率
- 修复 Habits 连击计算为真正的连续天数"
```

---

## 通过标准检查

- [ ] 所有 API 错误都有 toast 提示
- [ ] Direction 侧边栏显示真实完成率
- [ ] Habits 统计显示真实连击数
- [ ] 无控制台 Error 级别的错误输出（warning 除外）
