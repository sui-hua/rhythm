# App 模块文档

## 模块概述

App 模块是 Rhythm 应用的根模块，包含全局根组件 `App.vue` 和全局导航栏组件 `Navbar.vue`。负责应用布局、认证初始化、路由过渡和全局导航功能。

---

## App.vue 结构说明

### 文件位置
`src/App.vue`

### 职责
- 作为应用根组件，提供全局布局容器
- 初始化 Supabase 认证 session
- 管理路由过渡动画
- 监听多标签页间的登录状态同步

### 核心结构

```
<template>
  <div class="h-screen w-full">  <!-- 全屏布局容器 -->
    <Toaster />                   <!-- Toast 通知组件 -->
    <Navbar />                     <!-- 全局导航栏（有用户且未隐藏时显示） -->
    <RouterView>                   <!-- 路由视图（含过渡动画） -->
  </div>
</template>

<script setup>
  - 导入依赖：Vue Router、Supabase、Stores、通知权限
  - transitionName：根据路由选择 fade 或 slide 过渡效果
  - onMounted：检查 session、设置用户、请求通知权限、监听 auth 状态变化
</script>

<style scoped>
  - .view-fade-enter-active/leave-active：淡入淡出动画
  - .view-slide-enter-active/leave-active：滑动动画
  - 其他：隐藏滚动条、排版优化
</style>
```

### 路由过渡规则
| 路由 | 过渡效果 |
|------|----------|
| `/day` 相关 | `view-slide`（左右滑动） |
| 其他路由 | `view-fade`（淡入淡出） |

---

## Navbar.vue 导航组件说明

### 文件位置
`src/components/Navbar.vue`

### 职责
- 提供桌面端和移动端两套导航 UI
- 桌面端采用悬停滑出交互（hover reveal）
- 移动端采用底部固定导航栏
- 显示路由上下文面包屑（月/日视图的快捷导航）
- 提供登出功能

### 桌面端交互
```
1. 用户鼠标移入顶部 10px 热区（h-10）
2. 触发 group-hover，使 nav 面板从 -translate-y-[150%] 滑出至 translate-y-0
3. 鼠标移出后自动收回
```

### 移动端交互
```
1. 底部固定导航栏，始终可见
2. 顶部右侧固定登出按钮
3. 上下文信息显示在顶部居中位置
```

### 导航项配置
| 名称 | 路径 | 图标 |
|------|------|------|
| 时序 | `/day` | LayoutGrid |
| 习惯 | `/habits` | CheckCircle2 |
| 所向 | `/direction` | Compass |
| 总结 | `/summary` | BookOpen |

### contextInfo 面包屑
- `/month/:index` 模式：显示年份 + 返回年度按钮
- `/day/:month/:day` 模式：显示月份名 + 上/下日切换

---

## 文件修改记录

- `src/App.vue`：添加文件顶部注释、过渡逻辑注释、初始化逻辑注释
- `src/components/Navbar.vue`：添加文件顶部注释、菜单配置注释、激活判断注释、面包屑注释
