# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Rhythm Mobile — 基于 Expo + React Native 的日程管理应用，参考 rhythm web 版视觉风格。

## 常用命令

```bash
pnpm start        # 启动开发服务器
pnpm android      # 启动 Android 开发
pnpm ios          # 启动 iOS 开发
pnpm web          # 启动 Web 开发
pnpm test         # 运行测试 (jest-expo)
pnpm typecheck    # TypeScript 类型检查
```

单文件测试：
```bash
pnpm test -- src/domain/tasks/taskForm.test.ts
```

## 架构分层

```
app/                    # 页面路由层 (expo-router)
  (auth)/               # 认证相关页面
  (app)/                # 主应用页面
  _layout.tsx           # 根布局

src/
  components/ui/        # UI 组件层 (React Native Reusables 封装)
  features/            # 功能模块 (day, auth)
    day/
      screens/         # 页面组件
      components/      # 功能内组件
      hooks/           # 自定义 hooks
  domain/              # 领域模型 (tasks, day)
  services/            # 数据服务层 (Supabase)
  providers/           # 全局 Providers (React Query)
  lib/                 # 工具函数 (cn, utils)
```

## 技术栈

- **框架**: Expo SDK 54 + React Native 0.81
- **路由**: expo-router (文件系统路由)
- **样式**: NativeWind (Tailwind CSS 变体) + class-variance-authority
- **UI 组件**: React Native Reusables (@rn-primitives/*, @react-native-reusables/*)
- **状态**: Zustand (页面级状态) + React Query (服务端状态)
- **后端**: Supabase

## 设计规范

- **样式**: CSS 变量定义在 `tailwind.config.js` 的 `theme.extend.colors`
- **组件 variant**: 使用 `class-variance-authority` 定义
- **工具函数**: `cn()` 来自 `@/lib/utils` (clsx + tailwind-merge)
- **路径别名**: `@/` 指向 `src/`

## 规划与文档规范 (AGENTS.md)

- 设计规格存入 `docs/superpowers/specs/`
- 实施计划存入 `docs/superpowers/plans/`
- 计划文件使用中文，遵循固定头部格式 (Goal, Architecture, Tech Stack)
- 避免模糊表达，明确具体目录、文件、改动点
