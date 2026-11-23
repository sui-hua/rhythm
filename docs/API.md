# API 接口规范 (API.md)

全局前缀：`/api`  
鉴权方式：请求头携带 `Authorization: Bearer <accessToken>`（公开接口除外）

---

## 1. 认证与用户模块 (`/api/auth`)

### 1.1 用户注册
- **POST** `/api/auth/register`
- **公开接口**
- **请求体**：
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "用户昵称"
  }
  ```
- **响应** (201)：
  ```json
  {
    "user": { "id": "uuid", "email": "user@example.com", "name": "用户昵称" },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
  ```

### 1.2 账号密码登录
- **POST** `/api/auth/login`
- **公开接口**
- **请求体**：
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **响应** (200)：同注册返回

### 1.3 双 Token 刷新凭证
- **POST** `/api/auth/refresh`
- **公开接口**
- **请求体**：
  ```json
  {
    "refreshToken": "refresh_token"
  }
  ```
- **响应** (200)：
  ```json
  {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
  ```

### 1.4 退出登录
- **POST** `/api/auth/logout`
- **请求体**：`{ "refreshToken": "refresh_token" }`
- **响应** (200)：`{ "success": true }`

### 1.5 当前登录用户信息
- **GET** `/api/auth/me`
- **响应** (200)：
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "用户昵称",
    "createdAt": "2026-05-11T00:00:00.000Z"
  }
  ```

---

## 2. 时序与任务模块 (`/api/tasks`)

### 2.1 获取指定日期任务列表
- **GET** `/api/tasks`
- **Query 参数**：
  - `date`: `YYYY-MM-DD`（如 `2026-05-11`）
- **响应** (200)：
  ```json
  [
    {
      "id": "uuid",
      "title": "晨间专注阅读",
      "planTime": "07:30",
      "duration": 45,
      "completed": true,
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "学习"
      },
      "description": "阅读第4章"
    }
  ]
  ```

### 2.2 获取未排期收集箱任务
- **GET** `/api/tasks/inbox`
- **响应** (200)：返回 `planTime == null` 且未完成的任务列表

### 2.3 新建任务
- **POST** `/api/tasks`
- **请求体**：
  ```json
  {
    "date": "2026-05-11",
    "title": "移动端交互演进",
    "planTime": "09:00",
    "duration": 60,
    "categoryId": "uuid",
    "description": "细节核对"
  }
  ```
- **响应** (201)：返回新建的 Task 实体

### 2.4 编辑任务
- **PATCH** `/api/tasks/:id`
- **请求体**：Partial 更新字段

### 2.5 快捷切换任务完成状态
- **PATCH** `/api/tasks/:id/toggle`
- **请求体**：
  ```json
  {
    "completed": true
  }
  ```
- **响应** (200)：`{ "id": "uuid", "completed": true }`

### 2.6 删除任务
- **DELETE** `/api/tasks/:id`
- **响应** (200)：`{ "success": true }`

---

## 3. 习惯与打卡模块 (`/api/habits`)

### 3.1 获取全部习惯列表（含统计）
- **GET** `/api/habits`
- **Query 参数**：
  - `archived`: 可选，默认 `false`
- **响应** (200)：
  ```json
  [
    {
      "id": "uuid",
      "title": "早起晨读 30分钟",
      "repeatType": "daily",
      "repeatDays": [],
      "planTime": "07:00",
      "duration": 30,
      "archived": false,
      "streak": 11,
      "totalYear": 45,
      "completionRate": 91,
      "completedToday": true
    }
  ]
  ```

### 3.2 新建习惯
- **POST** `/api/habits`
- **请求体**：
  ```json
  {
    "title": "跑步健身 5km",
    "repeatType": "weekly",
    "repeatDays": [1, 3, 5],
    "planTime": "17:30",
    "duration": 45
  }
  ```
- **响应** (201)：新建的 Habit 实体

### 3.3 修改习惯配置
- **PATCH** `/api/habits/:id`
- **请求体**：Partial 习惯字段

### 3.4 习惯归档 / 取消归档
- **PATCH** `/api/habits/:id/archive`
- **请求体**：`{ "archived": true }`
- **响应** (200)：`{ "id": "uuid", "archived": true }`

### 3.5 删除习惯
- **DELETE** `/api/habits/:id`
- **响应** (200)：`{ "success": true }`

### 3.6 今日一键打卡（天然幂等）
- **POST** `/api/habits/:id/checkin`
- **请求体**：
  ```json
  {
    "date": "2026-05-11",
    "time": "07:15",
    "remark": "完成思考快与慢第4章"
  }
  ```
- **响应** (200)：返回该次 Checkin 记录及最新的 `streak` / `totalYear`

### 3.7 取消某天打卡
- **DELETE** `/api/habits/:id/checkin`
- **Query 参数**：
  - `date`: `YYYY-MM-DD`
- **响应** (200)：`{ "success": true }`

### 3.8 获取习惯历史打卡明细（月度热力图档案）
- **GET** `/api/habits/:id/logs`
- **Query 参数**：
  - `month`: `YYYY-MM`（如 `2026-05`）
- **响应** (200)：
  ```json
  {
    "month": "2026-05",
    "completedDays": ["2026-05-01", "2026-05-02", "2026-05-11"],
    "logs": [
      {
        "id": "uuid",
        "date": "2026-05-11",
        "time": "07:15",
        "remark": "呼吸觉察练习"
      }
    ]
  }
  ```

---

## 4. 所向与目标拆解模块 (`/api/goals`)

### 4.1 获取三级完整目标树（方向页核心总览接口）
- **GET** `/api/goals/overview`
- **响应** (200)：
  ```json
  {
    "categories": ["学习", "健康", "工作", "生活", "未分类"],
    "goals": [
      {
        "id": "uuid",
        "title": "掌握现代化全栈与 AI 架构",
        "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "学习"
      },
        "milestone": "5月：完成高保真原型交互演进",
        "progress": 60,
        "startMonth": 5,
        "endMonth": 8,
        "planTime": "09:00",
        "duration": 45,
        "carryOverDays": 3,
        "months": [
          {
            "id": "uuid",
            "month": 5,
            "title": "完成高保真原型交互演进",
            "days": [
              {
                "id": "uuid",
                "date": "2026-05-11",
                "day": 11,
                "title": "习惯与目标新增弹窗对齐",
                "completed": true,
                "planTime": "09:00",
                "duration": 45
              }
            ]
          }
        ]
      }
    ]
  }
  ```

### 4.2 目标分类管理
- **GET** `/api/goal-categories`：获取分类列表
- **POST** `/api/goal-categories`：`{ "name": "新分类", "sortOrder": 0 }`
- **DELETE** `/api/goal-categories/:id`：删除分类

### 4.3 新建年度总目标
- **POST** `/api/goals`
- **请求体**：
  ```json
  {
    "title": "年度目标",
    "categoryId": "uuid",
    "startMonth": 5,
    "endMonth": 8,
    "planTime": "09:00",
    "duration": 45,
    "carryOverLookbackDays": 3
  }
  ```

### 4.4 编辑 / 删除总目标
- **PATCH** `/api/goals/:id`
- **DELETE** `/api/goals/:id`

### 4.5 月度战役编辑
- **POST** `/api/goals/:goalId/months`：新增月份战役
- **PATCH** `/api/goal-months/:id`：修改月战役标题与排期
- **DELETE** `/api/goal-months/:id`：删除月战役

### 4.6 日度落地行动项（Day Plan）
- **POST** `/api/goal-months/:monthId/days`：添加某天落地目标
  ```json
  {
    "date": "2026-05-11",
    "title": "落地行动项",
    "planTime": "09:00",
    "duration": 45
  }
  ```
- **PATCH** `/api/goal-days/:id`：修改天目标
- **PATCH** `/api/goal-days/:id/toggle`：勾选/撤销天目标
  - **请求体**：`{ "completed": true }`
  - **响应** (200)：返回该项状态，并**自动返回父级目标更新后的 `progress`（完成率）**
- **DELETE** `/api/goal-days/:id`：删除天目标

---

## 5. 复盘总结模块 (`/api/summaries`)

### 5.1 获取指定周期的复盘沉浸日志流
- **GET** `/api/summaries`
- **Query 参数**：
  - `period_type`: `daily` | `weekly` | `monthly` | `yearly`
- **响应** (200)：
  ```json
  [
    {
      "id": "uuid",
      "periodType": "daily",
      "date": "2026-05-11",
      "text": "【今日成就】完成接口梳理\n【改进反思】控制设计颗粒度\n【明日焦点】数据库落地",
      "content": {
        "done": "完成接口梳理",
        "improve": "控制设计颗粒度",
        "tomorrow": "数据库落地"
      },
      "taskCompletionRate": 80,
      "completedHabitCount": 3
    }
  ]
  ```

### 5.2 新增 / 提交复盘总结
- **POST** `/api/summaries`
- **请求体**：
  ```json
  {
    "periodType": "daily",
    "periodStart": "2026-05-11T00:00:00.000Z",
    "periodEnd": "2026-05-11T23:59:59.999Z",
    "title": "5月11日 复盘",
    "content": {
      "done": "完成接口梳理",
      "improve": "节奏控制",
      "tomorrow": "数据库落地",
      "text": "合并后的完整文本"
    },
    "taskCompletionRate": 80,
    "completedHabitCount": 3
  }
  ```
- **响应** (201)：新建的 Summary 实体

### 5.3 编辑 / 删除复盘
- **PATCH** `/api/summaries/:id`
- **DELETE** `/api/summaries/:id`

---

## 6. 系统报表模块 (`/api/reports`)

### 6.1 查询当天日报播报状态
- **GET** `/api/reports/daily/status`
- **Query 参数**：`date=YYYY-MM-DD`
- **响应** (200)：`{ "reported": true, "reportDate": "2026-05-11" }`

### 6.2 标记当天日报已生成 / 已弹窗
- **POST** `/api/reports/daily/record`
- **请求体**：`{ "reportDate": "2026-05-11" }`
- **响应** (201)：`{ "success": true }`
