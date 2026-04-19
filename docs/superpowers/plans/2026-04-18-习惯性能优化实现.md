# 习惯页面性能优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除习惯页面重复请求，实现 habits 与 habit_logs 分离查询，按需加载日志数据。

**Architecture:** 数据层拆分 + Composable 重构 + 重复请求修复三层结构。`habits.list()` 不再关联 `habit_logs`，单独 `listLogsByHabit(habitId)` 按需加载日志。`useHabitData` 分工明确：只获取习惯列表，日志在选中习惯后单独拉取。

**Tech Stack:** Vue 3 Composition API, Supabase, Pinia, TypeScript

---

## 文件改动概览

| 文件 | 改动类型 | 职责 |
|------|----------|------|
| `src/services/db/habits.js` | 修改 | 拆分 list() 与 listLogsByHabit() |
| `src/services/safeDb.js` | 修改 | 透传 listLogsByHabit |
| `src/views/habits/composables/useHabitData.js` | 重构 | 分离习惯列表与日志获取逻辑 |
| `src/views/habits/composables/useHabitCalendar.js` | 修改 | 移除初始化多余触发 |
| `src/views/habits/index.vue` | 调整 | 传入 fetchLogsForHabit |

---

## Task 1: 数据层 - 拆分 habits 查询

**Files:**
- Modify: `src/services/db/habits.js`
- Test: 网络请求验证（Playwright MCP）

- [ ] **Step 1: 读取当前 habits.js 实现**

路径：`src/services/db/habits.js`

- [ ] **Step 2: 修改 `list()` 方法，移除 habit_logs 关联**

```javascript
async list() {
    return await supabase.query(q => q
        .select('*')
        .order('created_at', { ascending: true })
    )
},
```

- [ ] **Step 3: 新增 `listLogsByHabit(habitId)` 方法**

```javascript
async listLogsByHabit(habitId) {
    return await supabase.query(q => q
        .select('*')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: true })
    )
},
```

- [ ] **Step 4: 验证改动后 habits.js 完整代码**

当前 `habits.js` 应包含：
- `list()` — 只查 habits 表
- `listLite()` — 只查 habits 表
- `listLogsByDate(startDate, endDate)` — 按日期查 habit_logs
- `listLogsByHabit(habitId)` — 按习惯 ID 查该习惯的所有打卡记录
- `create/update/delete/log/deleteLog`

---

## Task 2: safeDb 层 - 透传 listLogsByHabit

**Files:**
- Modify: `src/services/safeDb.js`

- [ ] **Step 1: 读取当前 safeDb.js 实现**

路径：`src/services/safeDb.js`

- [ ] **Step 2: 检查 habits 表的 wrapTable 透传逻辑**

`wrapTable` 函数会透传非标准方法（`wrapTable` 中 `if (!wrapped[key]` 分支），`listLogsByHabit` 是新方法，会自动透传。

确认 `safeDb.habits.listLogsByHabit` 可直接使用。

- [ ] **Step 3: 如需显式添加，确保透传**

如果自动透传不生效，在 `wrapTable('habits')` 后手动添加：
```javascript
// 透传非标准方法
if (!wrapped.listLogsByHabit) {
    wrapped.listLogsByHabit = (...args) => db.habits.listLogsByHabit(...args)
}
```

---

## Task 3: useHabitCalendar - 移除重复触发

**Files:**
- Modify: `src/views/habits/composables/useHabitCalendar.js`

- [ ] **Step 1: 读取当前 useHabitCalendar.js 实现**

路径：`src/views/habits/composables/useHabitCalendar.js`

- [ ] **Step 2: 添加初始化标志位，防止重复触发**

```javascript
export function useHabitCalendar(emit) {
    // ... existing code ...

    let isInitialized = false

    onMounted(() => {
        if (!isInitialized) {
            isInitialized = true
            emitMonthChange()
        }
    })

    // ... rest of code ...
}
```

---

## Task 4: useHabitData - 重构数据流

**Files:**
- Modify: `src/views/habits/composables/useHabitData.js`

- [ ] **Step 1: 读取当前 useHabitData.js 实现**

路径：`src/views/habits/composables/useHabitData.js`

- [ ] **Step 2: 新增 currentHabitLogs ref**

```javascript
// 存储当前选中习惯的日志
const currentHabitLogs = ref([])
```

- [ ] **Step 3: 修改 fetchHabits()，只获取习惯列表**

```javascript
const fetchHabits = async () => {
    isPageLoading.value = true
    try {
        const rawHabits = await db.habits.list()
        allHabits.value = rawHabits.map((h) => {
            return {
                ...h,
                completedDays: [],   // 等待日志加载后由 selectedHabit 计算
                logs: [],
                monthlyLogs: [],
                total: 0,
                completionRate: 0,
                streak: 0
            }
        })

        // 维持选中状态
        if (selectedHabit.value) {
            const updated = allHabits.value.find((h) => h.id === selectedHabit.value.id)
            if (updated) selectedHabit.value = updated
            else selectedHabit.value = null
        } else if (habits.value.length > 0) {
            selectedHabit.value = habits.value[0]
        } else if (archivedHabits.value.length > 0) {
            selectedHabit.value = archivedHabits.value[0]
        }
    } catch (e) {
        console.error('Fetch habits failed', e)
    } finally {
        isPageLoading.value = false
    }
}
```

- [ ] **Step 4: 新增 fetchLogsForHabit(habitId) 方法**

```javascript
const fetchLogsForHabit = async (habitId) => {
    if (!habitId) {
        currentHabitLogs.value = []
        return
    }

    try {
        const logs = await db.habits.listLogsByHabit(habitId)
        currentHabitLogs.value = logs

        // 找到对应的习惯，更新其 logs 相关字段
        const habit = allHabits.value.find(h => h.id === habitId)
        if (habit) {
            const viewYearVal = viewYear.value
            const viewMonthVal = viewMonth.value

            const monthlyLogs = logs.filter((log) => {
                const d = new Date(log.completed_at)
                return d.getFullYear() === viewYearVal && d.getMonth() === viewMonthVal
            })

            const completedDays = monthlyLogs.map((log) => new Date(log.completed_at).getDate())

            const updatedHabit = {
                ...habit,
                logs,
                monthlyLogs,
                completedDays,
                total: logs.length,
                completionRate: Math.round((logs.length / 30) * 100),
                streak: calculateStreak(logs)
            }

            // 更新 allHabits 中的数据
            const index = allHabits.value.findIndex(h => h.id === habitId)
            if (index !== -1) {
                allHabits.value[index] = updatedHabit
            }

            // 更新 selectedHabit 引用
            if (selectedHabit.value && selectedHabit.value.id === habitId) {
                selectedHabit.value = updatedHabit
            }
        }
    } catch (e) {
        console.error('Fetch logs for habit failed', e)
    }
}
```

- [ ] **Step 5: 修改 handleMonthChange，移除 fetchHabits 调用**

```javascript
const handleMonthChange = ({ year, month }) => {
    viewYear.value = year
    viewMonth.value = month
    // 不再调用 fetchHabits，直接在内存中过滤
    // 但需要重新计算 completedDays 和 monthlyLogs
    if (selectedHabit.value && currentHabitLogs.value.length > 0) {
        const viewYearVal = year
        const viewMonthVal = month

        const monthlyLogs = currentHabitLogs.value.filter((log) => {
            const d = new Date(log.completed_at)
            return d.getFullYear() === viewYearVal && d.getMonth() === viewMonthVal
        })

        const completedDays = monthlyLogs.map((log) => new Date(log.completed_at).getDate())

        selectedHabit.value = {
            ...selectedHabit.value,
            monthlyLogs,
            completedDays
        }
    }
}
```

- [ ] **Step 6: 更新返回值，导出 fetchLogsForHabit**

```javascript
return {
    habits,
    archivedHabits,
    selectedHabit,
    viewYear,
    viewMonth,
    handleMonthChange,
    fetchHabits,
    fetchLogsForHabit,
    isPageLoading
}
```

---

## Task 5: index.vue - 调整调用逻辑

**Files:**
- Modify: `src/views/habits/index.vue`

- [ ] **Step 1: 读取当前 index.vue 实现**

路径：`src/views/habits/index.vue`

- [ ] **Step 2: 从 useHabitData 解构 fetchLogsForHabit**

```javascript
const {
    habits,
    archivedHabits,
    selectedHabit,
    viewYear,
    viewMonth,
    handleMonthChange,
    fetchHabits,
    fetchLogsForHabit,
    isPageLoading
} = useHabitData()
```

- [ ] **Step 3: 修改 useHabitLogs 调用，传入 fetchLogsForHabit**

当前：
```javascript
const {
    toggleComplete,
    handleQuickLog: performQuickLog
} = useHabitLogs(selectedHabit, viewYear, viewMonth, fetchHabits)
```

改为（useHabitLogs 不需要 fetchLogsForHabit，因为它只是做打卡操作）：
确认 useHabitLogs 不需要修改。

- [ ] **Step 4: 在 selectedHabit 变化时调用 fetchLogsForHabit**

在 `index.vue` 中，selectedHabit 是 ref，需要 watch 它来触发日志加载。

```javascript
import { ref, watch, onMounted } from 'vue'

// 在 onMounted(fetchHabits) 之后添加
watch(selectedHabit, (newHabit) => {
    if (newHabit) {
        fetchLogsForHabit(newHabit.id)
    }
}, { immediate: true })
```

注意：`{ immediate: true }` 会在首次挂载时自动触发，与 `onMounted(fetchHabits)` 配合，确保习惯和日志都能正确加载。

---

## Task 6: 验证与测试

- [ ] **Step 1: 启动开发服务器**

```bash
pnpm dev
```

- [ ] **Step 2: 使用 Playwright MCP 导航到习惯页面**

```javascript
await page.goto('http://localhost:5173/habits')
```

- [ ] **Step 3: 检查网络请求**

```javascript
const requests = await page.evaluate(() => {
    return window.__playwrightRequests || []
})
```

预期：
- `habits` 查询只出现 1-2 次（列表 + 可能的初始化）
- 不再有 6+ 次重复请求
- 日志在选中习惯后单独请求

- [ ] **Step 4: 验证月份切换不触发重复请求**

翻页月份，确认没有新的 `habits` 请求发出。

---

## Task 7: 提交代码

```bash
git add src/services/db/habits.js src/services/safeDb.js src/views/habits/composables/useHabitData.js src/views/habits/composables/useHabitCalendar.js src/views/habits/index.vue
git commit -m "$(cat <<'EOF'
feat(habits): 性能优化 - 分离 habits 与 habit_logs 查询

- habits.list() 不再关联 habit_logs，按需单独加载
- 修复 HabitCalendar onMounted 重复触发 fetchHabits 问题
- useHabitData 重构：fetchHabits 只获取列表，fetchLogsForHabit 单独加载日志
- 月份切换在内存中过滤，不重新请求
EOF
)"
```
