# 习惯页面性能优化设计

- 日期：2026-04-18
- 状态：已评审（待实现）
- 适用范围：`/habits` 页面

## 1. 问题背景

### 1.1 重复请求问题

进入习惯页面时，同一 `habits` 查询请求发送了 **6+ 次**，部分因 `ERR_INSUFFICIENT_RESOURCES` 失败。

**根因分析**：

1. `index.vue:128` — `onMounted(fetchHabits)` → 第 1 次请求
2. `HabitCalendar.vue:89-92` — `onMounted(() => emitMonthChange())` → 第 2 次请求（多余）
3. `useHabitData.js` 内部 `selectedHabit` 状态更新可能触发 computed 依赖链再次请求

### 1.2 全量加载问题

当前 `habits.list()` 一次性加载所有习惯及其**全部历史打卡记录**：

```javascript
// habits.list()
.select('*, habit_logs(*)')
```

数据量虽小（23 habits, 65 logs），但不合理的设计在数据增长时会成为瓶颈。

## 2. 优化目标

1. **消除重复请求**：页面加载时只发送必要的请求
2. **按需加载 logs**：切换习惯时才加载该习惯的打卡记录
3. **内存开销可控**：不缓存历史月份日志，每次视图切换重新查询

## 3. 数据流重构

### 3.1 重构前

```
页面加载
    │
    ▼
fetchHabits() ──全量查询 habits + 所有 habit_logs
    │
    ▼
所有习惯的 logs 全部在内存
```

### 3.2 重构后

```
页面加载
    │
    ▼
fetchHabits() ──只获取习惯列表（无 logs）
    │
    ▼
用户选择习惯 / 页面首次加载完成
    │
    ▼
fetchLogsForHabit(habitId) ──获取该习惯的所有打卡记录
    │
    ▼
内存中计算（按 viewMonth 过滤）：
  - completedDays
  - monthlyLogs
  - streak / total / completionRate
```

### 3.3 月份切换行为

翻页查看不同月份时，**不重新请求 logs**，直接在内存已有的 `logs` 数组中按 `viewMonth` 过滤。

## 4. 数据层改动

### 4.1 `src/services/db/habits.js`

| 方法 | 变化 |
|------|------|
| `list()` | **移除** `habit_logs(*)` 关联，只查 habits 表 |
| `getById(id)` | 保留：查单个习惯（无 logs） |
| `listLogsByHabit(habitId)` | 新增：查询指定习惯的**所有**打卡记录 |

```javascript
async list() {
    return await supabase.query(q => q
        .select('*')
        .order('created_at', { ascending: true })
    )
},

async listLogsByHabit(habitId) {
    return await supabase.query(q => q
        .select('*')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: true })
    )
}
```

### 4.2 `src/services/safeDb.js`

透传 `listLogsByHabit` 方法。

## 5. Composable 层改动

### 5.1 `useHabitData.js`

**改动点**：

1. `allHabits` 不再包含 `logs`，只存习惯基础信息
2. 新增 `currentHabitLogs` 存储当前选中习惯的日志
3. `fetchHabits()` 只拉习惯列表
4. 新增 `fetchLogsForHabit(habitId)` 专门拉取选中习惯的日志
5. 移除 `handleMonthChange` 中的 `fetchHabits()` 调用

**数据结构**：

```javascript
// 习惯列表（无 logs）
allHabits: [{
    id, title, frequency, is_archived, ...
}]

// 当前选中习惯的日志
currentHabitLogs: [{
    id, habit_id, completed_at, log, value
}]
```

**计算逻辑调整**：

```javascript
// 在 fetchLogsForHabit 之后执行
selectedHabit.value = {
    ...habit,
    logs: currentHabitLogs.value,           // 所有历史 logs
    completedDays: computed from logs (过滤 viewMonth)
    monthlyLogs: computed from logs (过滤 viewMonth)
}
```

### 5.2 `useHabitCalendar.js`

移除或添加初始化标志位，防止 `onMounted` 时重复触发：

```javascript
let isInitialized = false

onMounted(() => {
    if (!isInitialized) {
        isInitialized = true
        emitMonthChange()
    }
})
```

## 6. 文件改动清单

| 文件 | 改动类型 |
|------|----------|
| `src/services/db/habits.js` | 修改 |
| `src/services/safeDb.js` | 修改 |
| `src/views/habits/composables/useHabitData.js` | 重构 |
| `src/views/habits/composables/useHabitCalendar.js` | 修改 |
| `src/views/habits/index.vue` | 调整调用逻辑（传入 fetchLogsForHabit） |

## 7. 测试验证

1. 页面加载时网络请求数量显著减少
2. 切换习惯时正确加载该习惯的 logs
3. 月份翻页不触发新的日志请求
4. 打卡/取消打卡后数据正确更新
5. 骨架屏显示正常

## 8. 风险与回滚

- 风险：切换习惯时首次加载会有一瞬间空白
- 回滚：保留旧版 `list()` 带关联查询的代码分支，按需切回
