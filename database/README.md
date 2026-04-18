# Database 目录说明

这个项目的数据库真相源不是本地 SQL 文件，而是远程 Supabase 数据库。

## 当前约定

1. 数据库结构以 Supabase MCP 查询结果为准
2. 数据库变更通过 Supabase MCP 直接执行
3. 本地不再维护 `schema.sql`
4. 本地不再依赖 `supabase/` 目录
5. `database/` 目录只保留说明文档和基于 MCP 的结构快照

## 推荐工作流

1. 先用 MCP 查看真实表结构
2. 再用 MCP 执行数据库变更
3. 变更完成后，把结构变化同步到本目录文档
4. 如需复核，以 MCP 查询结果为最终依据

## 当前文档

- [current-structure.md](./current-structure.md)：根据 Supabase MCP 获取的当前结构快照
