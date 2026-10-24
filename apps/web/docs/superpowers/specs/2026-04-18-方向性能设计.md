# Direction 页面性能优化设计

## 问题描述

进入 Direction 页面时发起大量请求（特别是 8 个并行的 `daily_plans` 查询），导致页面加载缓慢。

## 优化方案

### 1. 数据加载策略

**首次加载（页面进入时）：**
1. `fetchData()` 加载 `plans` + `monthlyPlans`（保持不变）
2. 自动选中第一个目标的第一个月
3. 调用 `loadDailyPlans()` 预加载默认选中月的所有 `dailyPlans`

**月份切换时：**
1. 用户点击不同月份
2. 清空 `dailyPlansCache`（只保留当前月）
3. 调用 `loadDailyPlans()` 懒加载新选中月的所有 `dailyPlans`

### 2. 缓存策略

- `dailyPlansCache` 只保留当前选中月的缓存
- 切换月份时清除旧数据，避免内存堆积
- `monthlyPlans` 保留全量缓存（数据量小，切换频繁度低）

### 3. plans_category 重复请求修复

检查 `AddGoalModal` 和 `CategoryManagementModal` 的初始化逻辑，消除重复的 `plans_category` 查询。

## 数据流

```
页面进入 → fetchData() [plans + monthlyPlans]
        → 选中第一个目标的第一个月
        → loadDailyPlans(currentMonth) [首次预加载]

月份切换 → 清空 dailyPlansCache
       → loadDailyPlans(newMonth) [懒加载]
```

## 涉及文件

| 文件 | 修改内容 |
|------|----------|
| `src/views/direction/composables/useDirectionFetch.js` | 调整 fetchData() 逻辑，暴露 months defaulting 逻辑 |
| `src/views/direction/composables/useDirectionBatch.js` | 确保使用正确的 loadDailyPlans |
| `src/views/direction/components/MissionBoardMonthBody.vue` | 月份选中时触发清空和懒加载 |
| `src/views/direction/composables/useDirectionGoals.js` | 检查 plans_category 调用 |

## 实现步骤

1. 修改 `fetchData()` - 移除全量 dailyPlans 预加载
2. 修改月份选中逻辑 - 切换时清空缓存并懒加载
3. 排查并修复 plans_category 重复请求
4. 测试验证：首次加载请求数、月份切换流畅度
