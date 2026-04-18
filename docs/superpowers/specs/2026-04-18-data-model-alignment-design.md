# Rhythm Data Model Alignment Design

## Background

Current code and database definitions have diverged in several core areas:

1. `plans`, `monthly_plans`, `daily_plans`, and `habits` are missing fields that the frontend already reads and writes, especially `task_time` and `duration`.
2. The summary module mixes two incompatible models: `summaries` and `daily_summaries`.
3. Month/day routes do not include year, but data fetching depends on a separate date store year value.
4. Direction first-load data fetching is heavily serialized and will degrade as data grows.

This design aligns the app around a single source of truth for database contracts while keeping the current product mental model intact:

- Direction / Habits / Day remain separate user-facing modules.
- Daily / weekly / monthly / yearly summaries remain separate UX modes.
- The underlying persistence and service contracts become consistent.

## Goals

1. Make `database/schema.sql` accurately represent the fields used by the running app.
2. Unify summary persistence into one formal model while keeping different summary experiences in the UI.
3. Make year an explicit part of navigation and query truth.
4. Reduce Direction first-load latency without unrelated refactors.

## Non-Goals

1. No redesign of the core Direction, Habits, Day, or Summary page layouts.
2. No broad refactor of all database services beyond what is needed to align contracts.
3. No long-term dual-write or dual-read compatibility layer for old summary tables.

## Design Overview

The work is split into four tracks that should be implemented in order:

1. Schema and migration alignment
2. Summary model unification
3. Year-aware route normalization
4. Direction loading optimization

The schema becomes the authoritative contract. Service modules adapt database records into UI-specific shapes. Pages stop depending on implicit or missing fields.

## Track 1: Schema And Migration Alignment

### Required Table Alignment

The schema must be updated so it matches the existing frontend behavior:

#### `plans`

Add:

- `task_time TIME`
- `duration INTEGER`

Keep existing planning metadata such as `title`, `description`, `year`, `status`, and `priority`.

#### `monthly_plans`

Add:

- `task_time TIME`
- `duration INTEGER`

This preserves the current inheritance chain used by Day view:

- daily plan explicit time
- monthly plan inherited time
- parent plan inherited time

#### `daily_plans`

Add:

- `task_time TIME`
- `duration INTEGER`

Retain:

- unique constraint on `(monthly_plan_id, day)`
- cascade behavior from `monthly_plans`

Update batch RPC definitions to match these columns formally rather than relying on undeclared fields.

#### `habits`

Add:

- `task_time TIME`
- `duration INTEGER`

Rename `archived` to `is_archived`, or alternatively standardize the frontend to keep using `archived`.

Recommendation: prefer adding `is_archived BOOLEAN DEFAULT FALSE` and migrating data from `archived`, then update frontend reads to use the normalized name everywhere. The current code already expects `is_archived`.

#### `tasks`

Add the actual timer fields already used by Day and Pomodoro logic:

- `actual_start_time TIMESTAMP WITH TIME ZONE`
- `actual_end_time TIMESTAMP WITH TIME ZONE`

#### `habit_logs`

Normalize ownership explicitly:

- retain `habit_id`
- add `user_id UUID NOT NULL`

Rationale:

- simplifies RLS
- avoids cross-table policy dependence
- matches the rest of the app's ownership model

The current schema includes a partially generated `ALTER TABLE` block and commentary that should be replaced by a clean final definition.

### Schema Hygiene

While aligning fields, clean up schema defects that would otherwise keep causing confusion:

1. Remove duplicate index definitions.
2. Replace generated commentary SQL with valid final SQL only.
3. Ensure every table used by the frontend has clear ownership and RLS rules.
4. Keep naming conventions consistent across tables.

## Track 2: Unified Summary Model

### Product Decision

The UI continues to present four summary modes:

- daily
- weekly
- monthly
- yearly

The database uses one formal table and one formal record shape.

### Canonical Table

Use `summaries` as the single runtime table.

Required columns:

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL`
- `kind TEXT NOT NULL`
- `period_start TIMESTAMP WITH TIME ZONE NOT NULL`
- `period_end TIMESTAMP WITH TIME ZONE NOT NULL`
- `title TEXT`
- `content JSONB NOT NULL`
- `mood INTEGER`
- `created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`

`kind` allowed values:

- `daily`
- `weekly`
- `monthly`
- `yearly`

### Summary Record Contract

All frontend logic should operate on a single entity:

```ts
type SummaryRecord = {
  id: string
  user_id: string
  kind: 'daily' | 'weekly' | 'monthly' | 'yearly'
  period_start: string
  period_end: string
  title: string | null
  content: Record<string, unknown>
  mood: number | null
  created_at: string
  updated_at: string
}
```

### Content Shape By Kind

#### `daily`

Store:

```json
{
  "done": "string",
  "improve": "string",
  "tomorrow": "string"
}
```

#### `weekly`, `monthly`, `yearly`

Store:

```json
{
  "text": "string"
}
```

This keeps the current UX distinction while avoiding multiple persistence models.

### UI Behavior

#### Tabs

Tabs remain:

- 日总结
- 周总结
- 月总结
- 年总结

Each tab maps directly to a `kind`.

#### Forms

- `daily` uses a structured form with `done`, `improve`, `tomorrow`
- `weekly`, `monthly`, `yearly` use a generic form with `title`, `text`, `mood`

#### Sidebar Titles

- `daily`: first non-empty portion of `content.done`, fallback to a fixed empty-state label
- `weekly` / `monthly` / `yearly`: `title`, fallback to `content.text` excerpt

#### Sidebar Dates

- `daily`: one-day label from `period_start`
- `weekly`: range label from `period_start` to `period_end`
- `monthly`: year-month label from `period_start`
- `yearly`: year label from `period_start`

The UI must stop depending on nonexistent fields such as `summary.date`, and it must stop assuming daily content lives in a top-level string field.

### Summary Service Layer

Replace the current split service with one database-backed module plus adapters.

Recommended service API:

- `listByKind(kind)`
- `getById(id)`
- `save(record)`
- `remove(id)`
- `buildDefaultPeriod(kind, anchorDate)`
- `toFormModel(record)`
- `fromFormModel({ kind, formData, period, userId, existingRecord })`

The page and forms should not directly know table-specific persistence details.

### Migration Strategy

There should be no long-term dual-read or dual-write behavior.

#### Source Tables

- old `daily_summaries`
- old `summaries`

#### Target Table

- new normalized `summaries`

#### Daily Summary Migration

Map old `daily_summaries` rows into:

- `kind = 'daily'`
- `period_start = start of created day`
- `period_end = end of created day`
- `title = null`
- `content = { done: today_did, improve: today_issue, tomorrow: tomorrow_fix }`
- preserve `mood`, `created_at`

#### Existing Summary Migration

Map old `summaries.scope` into:

- `week -> weekly`
- `month -> monthly`
- `year -> yearly`

Map text content into:

- `content = { text: old_content }`

Map periods as follows:

- `weekly`: derive week boundaries from the legacy record timestamp
- `monthly`: derive month boundaries from the legacy record timestamp
- `yearly`: derive year boundaries from the legacy record timestamp

Legacy `quarter` records are out of current UI scope. Recommendation:

- migrate them into `monthly` is incorrect and should be avoided
- migrate them into `yearly` is also misleading
- instead preserve them in backup/export only, and exclude them from runtime until quarterly summaries are intentionally supported

This keeps the runtime model explicit and avoids hidden reinterpretation of old data.

### Backward Safety

Before applying migration:

1. Back up old `summaries`
2. Back up old `daily_summaries`

After migration:

1. Frontend reads only the new `summaries`
2. Frontend writes only the new `summaries`
3. Old tables are retained only for rollback or manual audit during the migration window

## Track 3: Year-Aware Routes

### Current Problem

The app currently uses routes like:

- `/month/:monthIndex`
- `/day/:monthIndex/:day`

but queries depend on `dateStore.currentDate.getFullYear()`.

This causes route state and query state to diverge around:

- cross-year navigation
- historical browsing
- December to January transitions

### Route Normalization

Make year explicit in route params.

Recommended route shapes:

- `/year/:year`
- `/month/:year/:monthIndex`
- `/day/:year/:monthIndex/:day`

Optional convenience redirect:

- `/day` redirects to today's full route

### Source Of Truth

After this change:

1. Route params become the primary source of truth for selected date context.
2. `dateStore` becomes a synchronized app-level helper, not the authority for data queries.
3. Navbar previous/next navigation must compute full year-month-day transitions.

### Required Consumers

Update:

- router definitions
- navbar navigation
- month view data fetching
- day view data fetching
- any helper generating links into month/day/year pages

## Track 4: Direction Loading Optimization

### Current Problem

Direction first load currently performs:

1. fetch all plans
2. for each plan, fetch monthly plans serially
3. for each monthly plan, fetch daily plans serially

This is a classic serialized N+1 pattern.

### Recommended Optimization

Implement the improvement in two steps:

#### Step 1: Parallelize Existing Requests

Without changing behavior significantly:

- fetch all monthly plan requests with `Promise.all`
- fetch all daily plan requests with `Promise.all`

This gives a safe performance win with low coordination cost.

#### Step 2: Optional Backend Aggregation

If Direction still feels heavy after step 1, consider a single nested query or RPC that returns:

- plans
- monthly_plans
- daily_plans

in one shaped payload.

This is explicitly optional in this design and should only be taken if step 1 is not enough.

## Error Handling

### Summary Module

1. Service layer should always attach `user_id` before writes.
2. Invalid `content` shapes should be normalized at adapter boundaries.
3. Missing title/text should degrade gracefully in sidebar rendering.

### Migration

1. Migration should fail loudly if required source columns are missing.
2. Summary migration should be idempotent or guarded against duplicate re-import.
3. Unsupported `quarter` summary rows should be reported explicitly.

### Routing

1. Invalid year/month/day params should redirect to the nearest valid canonical route.
2. Previous/next day transitions must cross month and year boundaries correctly.

## Testing Strategy

### Schema Verification

1. Verify all fields referenced by frontend CRUD now exist in schema.
2. Verify RLS still allows owned reads/writes and rejects cross-user access.
3. Verify batch daily-plan RPC works against declared columns.

### Summary Module

1. Can create, edit, list, and delete `daily` summary records.
2. Can create, edit, list, and delete `weekly`, `monthly`, and `yearly` summary records.
3. Sidebar date and title rendering matches `kind`.
4. Migrated legacy records render correctly.
5. `quarter` legacy records do not silently appear under the wrong tab.

### Routing

1. `/day/:year/:month/:day` loads the correct day data.
2. Previous/next day buttons work across month and year boundaries.
3. Month and year views query the year shown in the URL.

### Direction Performance

1. Direction still loads the correct plan tree.
2. Request count or total load latency is reduced relative to the serialized version.

## Implementation Order

1. Update `database/schema.sql` to match real field usage and clean up invalid definitions.
2. Add summary migration path and normalize `summaries` as the single runtime table.
3. Refactor `src/services/db/summaries.js` into a unified summary service plus adapters.
4. Update summary page, sidebar, and forms to consume `SummaryRecord`.
5. Normalize year-aware routes and update all route consumers.
6. Parallelize Direction loading requests.

## Risks

1. Schema changes touch multiple modules at once, so partial rollout will be fragile.
2. Summary migration can lose semantic accuracy if legacy records are reinterpreted loosely.
3. Route normalization may break existing bookmarks unless redirects are included.

## Open Decisions Resolved In This Design

1. Summary UX remains split by type, but persistence is unified.
2. `summaries` is the only runtime summary table.
3. No long-term dual-read compatibility layer will be kept.
4. Year becomes explicit in routing.
5. Direction optimization starts with parallelization before considering RPC aggregation.
