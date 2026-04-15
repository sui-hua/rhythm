# Summary 模块文档

## 模块概述

Summary（总结）模块是效能应用的核心回顾功能，支持日/周/月/年四种维度的总结记录与编辑。用户通过侧边栏切换不同时间维度的总结列表，选择具体条目进入编辑状态。

## 目录结构

```
src/views/summary/
├── index.vue                      # 模块主入口
├── components/
│   ├── SummarySidebar.vue        # 侧边栏组件
│   ├── DailySummaryForm.vue      # 日总结表单
│   └── GenericSummaryForm.vue    # 通用总结表单（周/月/年）
└── composables/
    ├── useSummaryManager.js      # 模块状态管理
    ├── useSummarySidebar.js       # 侧边栏逻辑
    ├── useDailySummaryForm.js     # 日总结表单逻辑
    └── useGenericSummaryForm.js   # 通用表单逻辑
```

## 核心组件说明

### index.vue

Summary 模块主入口组件，负责整体布局：
- 左侧：SummarySidebar 侧边栏（Tab 切换 + 总结列表 + 新增按钮）
- 右侧：主内容区，根据状态显示空状态/加载中/表单

### SummarySidebar.vue

侧边栏组件，特性：
- 支持 Tab 切换（日/周/月/年）
- 展示总结列表，显示日期和标题
- 右下角悬浮新增按钮
- 支持宽度拖拽调整（useResizable）
- 移动端自适应全宽

### DailySummaryForm.vue

日总结表单，包含三个字段：
- 今日成就（done）
- 改进之处（improve）
- 明日计划（tomorrow）

### GenericSummaryForm.vue

通用总结表单，用于周/月/年维度，单字段富文本编辑。

## Composables 说明

### useSummaryManager.js

模块状态管理核心 Composable：
- `activeTab`：当前 Tab（day/week/month/year）
- `summaries`：当前 Tab 下的总结列表
- `selectedSummary`：当前选中的总结
- `isCreating`：是否处于新建状态
- `currentView`：计算属性，返回 'empty'/'form'/'detail-or-edit'
- `loadSummaries()`：加载对应类型的总结列表
- `handleTabChange()`：Tab 切换，重置选中项
- `handleSave()`：保存总结，区分日总结和通用总结的 API

### useSummarySidebar.js

侧边栏展示逻辑：
- `tabs`：Tab 配置数组
- `formatDate()`：根据类型格式化日期显示
- `getSummaryTitle()`：获取总结标题（日总结取 done 字段，其他取 content 前 30 字符）

### useDailySummaryForm.js

日总结表单逻辑：
- `formData`：表单数据对象 { done, improve, tomorrow }
- `buildPayload()`：构建提交数据，将 formData 包装为 content 对象
- 自动解析初始数据的 JSON content 并回填表单

### useGenericSummaryForm.js

通用表单逻辑：
- `content`：富文本内容
- `typeName`：计算属性，返回"周"/"月"/"年"
- `placeholderText`：动态占位符文本
- `buildPayload()`：构建 { content } 对象

## 数据流简述

```
┌─────────────────────────────────────────────────────────────┐
│                        index.vue                             │
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │  SummarySidebar │    │         Main Content             │ │
│  │  - Tab 切换      │    │  ┌────────────────────────────┐  │ │
│  │  - 列表展示      │    │  │   DailySummaryForm         │  │ │
│  │  - 选择/新增     │    │  │   (日总结，三字段)          │  │ │
│  └────────┬────────┘    │  └────────────────────────────┘  │ │
│           │              │  ┌────────────────────────────┐  │ │
│           │              │  │   GenericSummaryForm      │  │ │
│           │              │  │   (周/月/年，单字段)       │  │ │
│           │              │  └────────────────────────────┘  │ │
│           │              └──────────────────────────────────┘ │
│           │                                                   │
│  ┌────────▼────────────────────────────────────────┐        │
│  │              useSummaryManager                    │        │
│  │  - 管理 summaries、selectedSummary、isCreating   │        │
│  │  - 调用 db.summaries CRUD 操作                  │        │
│  └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 数据库操作

通过 `db.summaries` 访问：
- `listDaily()`：获取日总结列表
- `list(scope)`：获取周/月/年总结列表
- `saveDaily(data)`：保存日总结
- `create(data)`：创建周月年总结
- `update(id, data)`：更新周月年总结
- `deleteDaily(id)` / `delete(id)`：删除总结

## 路由

Summary 模块对应 `/summary` 路由。
