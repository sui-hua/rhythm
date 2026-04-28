# Day MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable native `Day` experience in `rhythm-mobile`, covering auth, task CRUD, completion toggling, unscheduled tasks, and basic local notifications.

**Architecture:** The mobile app is a standalone `Expo + React Native + TypeScript` project that talks directly to the existing Supabase backend. Server state lives in `TanStack Query`, local interaction state lives in `Zustand`, and the `Day` feature is split into focused files for auth, task services, task domain helpers, screens, and notification orchestration.

**Tech Stack:** Expo, React Native, TypeScript, Expo Router, Supabase, TanStack Query, Zustand, Jest, React Native Testing Library, Expo Notifications

---

## File Structure

### Planned Files

- Create: `rhythm-mobile/package.json`
- Create: `rhythm-mobile/app/_layout.tsx`
- Create: `rhythm-mobile/app/index.tsx`
- Create: `rhythm-mobile/app/(auth)/login.tsx`
- Create: `rhythm-mobile/app/(app)/day.tsx`
- Create: `rhythm-mobile/src/providers/AppProviders.tsx`
- Create: `rhythm-mobile/src/services/supabase/client.ts`
- Create: `rhythm-mobile/src/services/supabase/auth.ts`
- Create: `rhythm-mobile/src/services/supabase/tasks.ts`
- Create: `rhythm-mobile/src/services/notifications/taskNotifications.ts`
- Create: `rhythm-mobile/src/domain/tasks/types.ts`
- Create: `rhythm-mobile/src/domain/tasks/taskForm.ts`
- Create: `rhythm-mobile/src/domain/tasks/taskGroups.ts`
- Create: `rhythm-mobile/src/features/auth/useAuthSession.ts`
- Create: `rhythm-mobile/src/features/day/useDayTasks.ts`
- Create: `rhythm-mobile/src/features/day/useTaskEditorStore.ts`
- Create: `rhythm-mobile/src/features/day/components/DateSwitcher.tsx`
- Create: `rhythm-mobile/src/features/day/components/TaskCard.tsx`
- Create: `rhythm-mobile/src/features/day/components/TaskList.tsx`
- Create: `rhythm-mobile/src/features/day/components/UnscheduledSection.tsx`
- Create: `rhythm-mobile/src/features/day/components/TaskEditorSheet.tsx`
- Create: `rhythm-mobile/src/features/day/components/NotificationPermissionCard.tsx`
- Create: `rhythm-mobile/src/features/day/screens/DayScreen.tsx`
- Create: `rhythm-mobile/src/shared/ui/Button.tsx`
- Create: `rhythm-mobile/src/shared/ui/TextField.tsx`
- Create: `rhythm-mobile/src/shared/ui/Screen.tsx`
- Create: `rhythm-mobile/src/shared/utils/date.ts`
- Create: `rhythm-mobile/src/shared/utils/time.ts`
- Create: `rhythm-mobile/src/test/render.tsx`
- Create: `rhythm-mobile/src/domain/tasks/__tests__/taskGroups.test.ts`
- Create: `rhythm-mobile/src/domain/tasks/__tests__/taskForm.test.ts`
- Create: `rhythm-mobile/src/features/day/__tests__/DayScreen.test.tsx`
- Create: `rhythm-mobile/src/features/day/__tests__/TaskEditorSheet.test.tsx`
- Create: `rhythm-mobile/src/services/notifications/__tests__/taskNotifications.test.ts`
- Modify later: `rhythm-mobile/app.json`
- Modify later: `rhythm-mobile/babel.config.js`
- Modify later: `rhythm-mobile/tsconfig.json`

### Boundaries

- `src/services/supabase/*` only knows backend I/O and row mapping.
- `src/domain/tasks/*` contains pure task rules: validation, grouping, sorting, conversion.
- `src/features/day/*` owns mobile-specific task presentation and interaction flows.
- `src/services/notifications/*` translates task timing into Expo notifications.
- `app/*` wires routes and chooses auth vs app shell.

## Task 1: Scaffold Expo Project And Tooling

**Files:**
- Create: `rhythm-mobile/package.json`
- Create: `rhythm-mobile/app/_layout.tsx`
- Create: `rhythm-mobile/app/index.tsx`
- Create: `rhythm-mobile/src/providers/AppProviders.tsx`
- Modify: `rhythm-mobile/app.json`
- Modify: `rhythm-mobile/babel.config.js`
- Modify: `rhythm-mobile/tsconfig.json`

- [ ] **Step 1: Write the failing smoke test for the root route**

- [ ] **Step 2: Run test to verify the project is not scaffolded yet**

- [ ] **Step 3: Create the minimal Expo shell and providers**

- [ ] **Step 4: Run tests and typecheck to verify the shell builds**

- [ ] **Step 5: Commit scaffold**

## Task 2: Add Supabase Client And Session Gate

**Files:**
- Create: `rhythm-mobile/src/services/supabase/client.ts`
- Create: `rhythm-mobile/src/services/supabase/auth.ts`
- Create: `rhythm-mobile/src/features/auth/useAuthSession.ts`
- Create: `rhythm-mobile/app/(auth)/login.tsx`
- Modify: `rhythm-mobile/app/index.tsx`

- [ ] **Step 1: Write the failing auth session hook test**

- [ ] **Step 2: Run the auth test to verify it fails**

- [ ] **Step 3: Implement the minimal Supabase client and session hook**

- [ ] **Step 4: Add login screen and root redirect behavior**

- [ ] **Step 5: Run tests and commit auth gate**

## Task 3: Define Task Domain Types, Validation, And Grouping

**Files:**
- Create: `rhythm-mobile/src/domain/tasks/types.ts`
- Create: `rhythm-mobile/src/domain/tasks/taskForm.ts`
- Create: `rhythm-mobile/src/domain/tasks/taskGroups.ts`
- Create: `rhythm-mobile/src/shared/utils/date.ts`
- Create: `rhythm-mobile/src/shared/utils/time.ts`
- Test: `rhythm-mobile/src/domain/tasks/__tests__/taskForm.test.ts`
- Test: `rhythm-mobile/src/domain/tasks/__tests__/taskGroups.test.ts`

- [ ] **Step 1: Write failing domain tests**

- [ ] **Step 2: Run domain tests to verify they fail**

- [ ] **Step 3: Implement pure task domain helpers**

- [ ] **Step 4: Run tests to verify domain logic passes**

- [ ] **Step 5: Commit domain layer**

## Task 4: Implement Task Service And Day Query Hook

**Files:**
- Create: `rhythm-mobile/src/services/supabase/tasks.ts`
- Create: `rhythm-mobile/src/features/day/useDayTasks.ts`
- Modify: `rhythm-mobile/src/domain/tasks/types.ts`

- [ ] **Step 1: Write the failing day query hook test**

- [ ] **Step 2: Run the hook test to verify it fails**

- [ ] **Step 3: Implement task listing service and query hook**

- [ ] **Step 4: Run the hook test to verify it passes**

- [ ] **Step 5: Commit query layer**

## Task 5: Build Day Screen Read-Only MVP Shell

**Files:**
- Create: `rhythm-mobile/src/features/day/screens/DayScreen.tsx`
- Create: `rhythm-mobile/src/features/day/components/DateSwitcher.tsx`
- Create: `rhythm-mobile/src/features/day/components/TaskCard.tsx`
- Create: `rhythm-mobile/src/features/day/components/TaskList.tsx`
- Create: `rhythm-mobile/src/features/day/components/UnscheduledSection.tsx`
- Create: `rhythm-mobile/src/shared/ui/Screen.tsx`
- Create: `rhythm-mobile/src/shared/ui/Button.tsx`
- Create: `rhythm-mobile/app/(app)/day.tsx`
- Test: `rhythm-mobile/src/features/day/__tests__/DayScreen.test.tsx`

- [ ] **Step 1: Expand the Day screen test to match the MVP structure**

- [ ] **Step 2: Run the screen test to verify it fails**

- [ ] **Step 3: Implement the read-only Day shell**

- [ ] **Step 4: Run the screen test to verify the shell passes**

- [ ] **Step 5: Commit the Day read-only shell**

## Task 6: Add Task Editor Sheet And CRUD Mutations

**Files:**
- Create: `rhythm-mobile/src/features/day/useTaskEditorStore.ts`
- Create: `rhythm-mobile/src/features/day/components/TaskEditorSheet.tsx`
- Modify: `rhythm-mobile/src/services/supabase/tasks.ts`
- Modify: `rhythm-mobile/src/features/day/screens/DayScreen.tsx`
- Test: `rhythm-mobile/src/features/day/__tests__/TaskEditorSheet.test.tsx`

- [ ] **Step 1: Write the failing editor sheet test**

- [ ] **Step 2: Run the sheet test to verify it fails**

- [ ] **Step 3: Implement CRUD service methods and editor sheet**

- [ ] **Step 4: Wire create/edit/delete flows into DayScreen and verify tests**

- [ ] **Step 5: Commit CRUD flow**

## Task 7: Add Completion Toggle And Unscheduled Editing

**Files:**
- Modify: `rhythm-mobile/src/services/supabase/tasks.ts`
- Modify: `rhythm-mobile/src/features/day/components/TaskCard.tsx`
- Modify: `rhythm-mobile/src/features/day/components/UnscheduledSection.tsx`
- Modify: `rhythm-mobile/src/features/day/screens/DayScreen.tsx`

- [ ] **Step 1: Write the failing task card interaction test**

- [ ] **Step 2: Run the interaction test to verify it fails**

- [ ] **Step 3: Implement completion toggle and unscheduled edit entry**

- [ ] **Step 4: Run screen tests to verify completion and unscheduled editing work**

- [ ] **Step 5: Commit task interactions**

## Task 8: Add Notification Permission Card And Task Reminder Sync

**Files:**
- Create: `rhythm-mobile/src/services/notifications/taskNotifications.ts`
- Create: `rhythm-mobile/src/features/day/components/NotificationPermissionCard.tsx`
- Modify: `rhythm-mobile/src/features/day/screens/DayScreen.tsx`
- Test: `rhythm-mobile/src/services/notifications/__tests__/taskNotifications.test.ts`

- [ ] **Step 1: Write the failing reminder scheduling test**

- [ ] **Step 2: Run the notification test to verify it fails**

- [ ] **Step 3: Implement permission card and reminder sync**

- [ ] **Step 4: Verify reminders sync from DayScreen**

- [ ] **Step 5: Commit notifications**

## Task 9: Polish Login Inputs And Real Auth Submission

**Files:**
- Modify: `rhythm-mobile/app/(auth)/login.tsx`
- Create: `rhythm-mobile/src/shared/ui/TextField.tsx`
- Modify: `rhythm-mobile/src/services/supabase/auth.ts`

- [ ] **Step 1: Write the failing login screen test**

- [ ] **Step 2: Run the login test to verify it fails**

- [ ] **Step 3: Implement real auth submission**

- [ ] **Step 4: Run login tests and manual auth verification**

- [ ] **Step 5: Commit login flow**

## Task 10: Verification And Documentation Pass

**Files:**
- Modify: `rhythm-mobile/README.md`
- Modify: `rhythm-mobile/docs/superpowers/specs/2026-04-20-移动端原生迁移设计.md`
- Create: `rhythm-mobile/docs/testing/day-mvp-smoke-checklist.md`

- [ ] **Step 1: Write the smoke checklist doc**

- [ ] **Step 2: Run the full automated test suite**

- [ ] **Step 3: Run the manual Expo smoke flow**

- [ ] **Step 4: Update README with setup and env requirements**

- [ ] **Step 5: Commit verification docs**

## Self-Review

### Spec Coverage

- `Expo + React Native + TypeScript` project setup: Task 1.
- Supabase auth and session recovery: Tasks 2 and 9.
- Day page with date switching and grouped task display: Tasks 4 and 5.
- Task CRUD and completion toggling: Tasks 6 and 7.
- Unscheduled task section: Tasks 5 and 7.
- Basic notification permission and reminder sync: Task 8.
- Verification and setup docs: Task 10.

### Placeholder Scan

- Deferred CRUD stubs introduced in Task 4 are completed in Task 6.
- No `TODO`, `TBD`, or "implement later" placeholders remain in the execution sequence.
- Every test, command, and commit message is explicit.

### Type Consistency

- `TaskRecord` and `TaskFormInput` are introduced in Task 3 and reused consistently in Tasks 4, 6, 7, and 8.
- Query key format remains `['day-tasks', yyyy-mm-dd]` across read and mutation invalidation steps.
- Notification sync uses `TaskRecord.startAt` consistently with the task grouping model.
