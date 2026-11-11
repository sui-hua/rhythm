# Rhythm

一款面向个人使用的效能与生活规划 Web 应用。Rhythm 将长期目标、周期习惯、每日任务和阶段总结组织到同一套工作流中，帮助用户完成从“确定方向”到“安排时间、持续执行、定期复盘”的闭环。

## 功能概览

| 模块 | 路由 | 核心能力 |
| --- | --- | --- |
| 时序 | `/day/:year/:month/:day` | 24 小时时间线、任务拖拽与缩放、番茄钟、多来源执行项聚合、日终报告 |
| 所向 | `/direction` | 长期目标 → 月计划 → 日任务三级拆解、日期拖选、批量排期、分类与归档 |
| 习惯 | `/habits` | 每日 / 每周 / 每月频率、快捷打卡、热力日历、连续打卡与完成率统计 |
| 月视图 | `/month/:year/:month` | 按月聚合任务、目标日计划和习惯记录，支持快速下钻到日视图 |
| 年视图 | `/year/:year` | 全年习惯热力概览与月份导航 |
| 总结 | `/summary` | 日 / 周 / 月 / 年总结的创建、编辑、删除与周期导航 |

## 技术栈

- Vue 3.5、TypeScript、Composition API 与 `<script setup>`
- Vite 7
- Pinia 3 与持久化插件
- Tailwind CSS 4
- Supabase（PostgreSQL、Auth、Row Level Security）
- Reka UI、Lucide Vue Next
- VueUse、date-fns、TanStack Virtual
- Vitest、Vue Test Utils、Playwright
