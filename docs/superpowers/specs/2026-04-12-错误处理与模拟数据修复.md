# 统一错误处理与假数据修复方案

## 目标

修复三个模块（Day / Habits / Direction）的高优先级问题：
1. API 错误无用户反馈
2. 硬编码假数据（Direction 65% 负载、Habits 连击计算错误）

## 方案概述

### 第一部分：统一错误处理

#### 1.1 Toast 组件安装

```bash
npx shadcn-vue@latest add toast
```

#### 1.2 SafeDb 封装

创建 `src/services/safeDb.js`，包装原始 `db` 对象，自动捕获错误并 toast。

**错误消息配置**：

| 表 | 操作 | 错误消息 |
|----|------|---------|
| plans | list/create/update/delete | 获取/创建/更新/删除目标失败 |
| tasks | list/create/update/delete | 获取/创建/更新/删除任务失败 |
| habits | list/create/update/delete | 获取/创建/更新/删除习惯失败 |
| habit_logs | create/delete | 打卡失败 |
| dailyPlans | list/create/update/delete | 获取/创建/更新/删除日计划失败 |
| monthlyPlans | list/create/update/delete | 获取/创建/更新/删除月计划失败 |

**API**：

```javascript
import { safeDb } from '@/services/safeDb'

// 使用方式 - 无需 try-catch
const tasks = await safeDb.tasks.list(userId)
if (!tasks) return  // null 表示失败

// 需要自定义错误处理时仍可用原始 db
import { db } from '@/services/database'
```

#### 1.3 需要修改的文件

| 模块 | 文件 | 改动 |
|-----|------|------|
| Day | `src/views/day/composables/useAddEventForm.js` | `db` → `safeDb` |
| Day | `src/views/day/composables/useDayData.js` | `db` → `safeDb` |
| Habits | `src/views/habits/composables/useHabitData.js` | `db` → `safeDb` |
| Habits | `src/views/habits/composables/useHabitLogs.js` | `db` → `safeDb` |
| Direction | `src/views/direction/composables/useDirectionGoals.js` | `db` → `safeDb` |
| Direction | `src/views/direction/composables/useDirectionFetch.js` | `db` → `safeDb` |

---

### 第二部分：假数据修复

#### 2.1 Direction "系统推进负载 65%"

**问题位置**：`src/views/direction/components/DirectionSidebar.vue` L44-47

**修复方案**：
- 基于选中目标当前月份的日计划完成率计算
- 公式：`完成数 / 总数 * 100`

**实现**：
```javascript
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

#### 2.2 Habits "连击计算"

**问题位置**：`src/views/habits/composables/useHabitData.js` L42-44

**修复前**（错误）：
```javascript
const calculateStreak = (logs) => {
    return logs.length > 0 ? logs.length : 0  // 这是总次数，不是连击！
}
```

**修复后**：
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

---

## 实施顺序

1. 安装 toast 组件
2. 创建 `safeDb.js`
3. 修改三个模块的 composables 使用 `safeDb`
4. 修复 Direction 65% 负载
5. 修复 Habits 连击计算

## 通过标准

- [ ] 所有 API 错误都有 toast 提示
- [ ] Direction 侧边栏显示真实完成率
- [ ] Habits 统计显示真实连击数
- [ ] 无控制台 Error 级别的错误输出（warning 除外）
