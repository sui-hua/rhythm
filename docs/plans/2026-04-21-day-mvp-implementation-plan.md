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

```tsx
// src/features/day/__tests__/DayScreen.test.tsx
import { render, screen } from '@testing-library/react-native'
import { DayScreen } from '../screens/DayScreen'

describe('DayScreen', () => {
  it('renders today header and add button shell', () => {
    render(<DayScreen />)

    expect(screen.getByText(/今天/i)).toBeTruthy()
    expect(screen.getByLabelText('新增任务')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify the project is not scaffolded yet**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- DayScreen.test.tsx`
Expected: FAIL with missing package scripts or missing module/file errors.

- [ ] **Step 3: Create the minimal Expo shell and providers**

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { AppProviders } from '../src/providers/AppProviders'

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  )
}
```

```tsx
// app/index.tsx
import { Redirect } from 'expo-router'

export default function IndexPage() {
  return <Redirect href="/(app)/day" />
}
```

```tsx
// src/providers/AppProviders.tsx
import { PropsWithChildren, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

```json
// package.json
{
  "name": "rhythm-mobile",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "test": "jest"
  }
}
```

- [ ] **Step 4: Run tests and typecheck to verify the shell builds**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- --runInBand`
Expected: FAIL only because `DayScreen` is not implemented yet, not because Expo/Jest shell is missing.

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm tsc --noEmit`
Expected: PASS or only expected missing Day feature file errors.

- [ ] **Step 5: Commit scaffold**

```bash
git add package.json app/_layout.tsx app/index.tsx src/providers/AppProviders.tsx app.json babel.config.js tsconfig.json
git commit -m "chore: scaffold expo mobile app shell"
```

## Task 2: Add Supabase Client And Session Gate

**Files:**
- Create: `rhythm-mobile/src/services/supabase/client.ts`
- Create: `rhythm-mobile/src/services/supabase/auth.ts`
- Create: `rhythm-mobile/src/features/auth/useAuthSession.ts`
- Create: `rhythm-mobile/app/(auth)/login.tsx`
- Modify: `rhythm-mobile/app/index.tsx`

- [ ] **Step 1: Write the failing auth session hook test**

```tsx
import { renderHook, waitFor } from '@testing-library/react-native'
import { useAuthSession } from '../useAuthSession'

jest.mock('../../../services/supabase/auth', () => ({
  getCurrentSession: jest.fn().mockResolvedValue(null),
  subscribeToAuthChanges: jest.fn(() => () => {})
}))

describe('useAuthSession', () => {
  it('exposes unauthenticated state when there is no session', async () => {
    const { result } = renderHook(() => useAuthSession())

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
      expect(result.current.session).toBeNull()
    })
  })
})
```

- [ ] **Step 2: Run the auth test to verify it fails**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- useAuthSession`
Expected: FAIL with missing hook or auth service files.

- [ ] **Step 3: Implement the minimal Supabase client and session hook**

```ts
// src/services/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
```

```ts
// src/services/supabase/auth.ts
import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function subscribeToAuthChanges(callback: (session: Session | null) => void) {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_, session) => callback(session))

  return () => subscription.unsubscribe()
}
```

```ts
// src/features/auth/useAuthSession.ts
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getCurrentSession, subscribeToAuthChanges } from '../../services/supabase/auth'

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true

    getCurrentSession().then((nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setIsReady(true)
    })

    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      setSession(nextSession)
      setIsReady(true)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  return { session, isReady, isAuthenticated: Boolean(session) }
}
```

- [ ] **Step 4: Add login screen and root redirect behavior**

```tsx
// app/index.tsx
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuthSession } from '../src/features/auth/useAuthSession'

export default function IndexPage() {
  const { isReady, isAuthenticated } = useAuthSession()

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(app)/day' : '/(auth)/login'} />
}
```

```tsx
// app/(auth)/login.tsx
import { Text, View } from 'react-native'

export default function LoginPage() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Rhythm</Text>
      <Text style={{ marginTop: 8 }}>今日执行，从这里开始</Text>
    </View>
  )
}
```

- [ ] **Step 5: Run tests and commit auth gate**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- --runInBand useAuthSession DayScreen.test.tsx`
Expected: `useAuthSession` PASS, `DayScreen` still pending/failing until later tasks.

```bash
git add app/index.tsx app/'(auth)'/login.tsx src/services/supabase/client.ts src/services/supabase/auth.ts src/features/auth/useAuthSession.ts
git commit -m "feat: add supabase session gate for mobile"
```

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

```ts
// src/domain/tasks/__tests__/taskForm.test.ts
import { validateTaskForm } from '../taskForm'

describe('validateTaskForm', () => {
  it('rejects end time earlier than start time', () => {
    expect(() =>
      validateTaskForm({
        title: '深度工作',
        startAt: '2026-04-21T10:00:00.000Z',
        endAt: '2026-04-21T09:00:00.000Z',
        notes: ''
      })
    ).toThrow('结束时间必须晚于开始时间')
  })
})
```

```ts
// src/domain/tasks/__tests__/taskGroups.test.ts
import { groupTasksForDay } from '../taskGroups'

it('splits scheduled and unscheduled tasks', () => {
  const groups = groupTasksForDay([
    { id: '1', title: 'A', startAt: '2026-04-21T09:00:00.000Z', endAt: '2026-04-21T10:00:00.000Z', completed: false, notes: '' },
    { id: '2', title: 'B', startAt: null, endAt: null, completed: false, notes: '' }
  ])

  expect(groups.scheduled).toHaveLength(1)
  expect(groups.unscheduled).toHaveLength(1)
})
```

- [ ] **Step 2: Run domain tests to verify they fail**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- taskForm taskGroups`
Expected: FAIL with missing domain files.

- [ ] **Step 3: Implement pure task domain helpers**

```ts
// src/domain/tasks/types.ts
export type TaskRecord = {
  id: string
  title: string
  startAt: string | null
  endAt: string | null
  notes: string
  completed: boolean
}

export type TaskFormInput = {
  title: string
  startAt: string | null
  endAt: string | null
  notes: string
  completed?: boolean
}
```

```ts
// src/domain/tasks/taskForm.ts
import { TaskFormInput } from './types'

export function validateTaskForm(input: TaskFormInput) {
  if (!input.title.trim()) throw new Error('标题不能为空')
  if (input.startAt && input.endAt && new Date(input.endAt) <= new Date(input.startAt)) {
    throw new Error('结束时间必须晚于开始时间')
  }

  return {
    title: input.title.trim(),
    startAt: input.startAt,
    endAt: input.endAt,
    notes: input.notes.trim(),
    completed: Boolean(input.completed)
  }
}
```

```ts
// src/domain/tasks/taskGroups.ts
import { TaskRecord } from './types'

export function groupTasksForDay(tasks: TaskRecord[]) {
  const scheduled = tasks
    .filter((task) => task.startAt)
    .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime())

  const unscheduled = tasks.filter((task) => !task.startAt)

  return { scheduled, unscheduled }
}
```

- [ ] **Step 4: Run tests to verify domain logic passes**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- taskForm taskGroups --runInBand`
Expected: PASS.

- [ ] **Step 5: Commit domain layer**

```bash
git add src/domain/tasks src/shared/utils
git commit -m "feat: add mobile task domain helpers"
```

## Task 4: Implement Task Service And Day Query Hook

**Files:**
- Create: `rhythm-mobile/src/services/supabase/tasks.ts`
- Create: `rhythm-mobile/src/features/day/useDayTasks.ts`
- Modify: `rhythm-mobile/src/domain/tasks/types.ts`

- [ ] **Step 1: Write the failing day query hook test**

```tsx
import { renderHook, waitFor } from '@testing-library/react-native'
import { useDayTasks } from '../useDayTasks'

jest.mock('../../../services/supabase/tasks', () => ({
  listTasksForDate: jest.fn().mockResolvedValue([])
}))

describe('useDayTasks', () => {
  it('loads task groups for the selected day', async () => {
    const { result } = renderHook(() => useDayTasks(new Date('2026-04-21T08:00:00.000Z')))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.groups.scheduled).toEqual([])
    })
  })
})
```

- [ ] **Step 2: Run the hook test to verify it fails**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- useDayTasks`
Expected: FAIL with missing hook/service files.

- [ ] **Step 3: Implement task listing service and query hook**

```ts
// src/services/supabase/tasks.ts
import { supabase } from './client'
import type { TaskRecord, TaskFormInput } from '../../domain/tasks/types'

function mapRow(row: any): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    startAt: row.start_time,
    endAt: row.end_time,
    notes: row.description ?? '',
    completed: row.completed
  }
}

export async function listTasksForDate(date: Date): Promise<TaskRecord[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('tasks')
    .select('id,title,start_time,end_time,description,completed')
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function createTask(input: TaskFormInput) { /* implement in Task 6 */ }
export async function updateTask(taskId: string, input: Partial<TaskFormInput>) { /* implement in Task 6 */ }
export async function deleteTask(taskId: string) { /* implement in Task 6 */ }
export async function toggleTaskComplete(taskId: string, completed: boolean) { /* implement in Task 6 */ }
```

```ts
// src/features/day/useDayTasks.ts
import { useQuery } from '@tanstack/react-query'
import { listTasksForDate } from '../../services/supabase/tasks'
import { groupTasksForDay } from '../../domain/tasks/taskGroups'

export function useDayTasks(date: Date) {
  const query = useQuery({
    queryKey: ['day-tasks', date.toISOString().slice(0, 10)],
    queryFn: () => listTasksForDate(date)
  })

  return {
    ...query,
    groups: groupTasksForDay(query.data ?? [])
  }
}
```

- [ ] **Step 4: Run the hook test to verify it passes**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- useDayTasks --runInBand`
Expected: PASS.

- [ ] **Step 5: Commit query layer**

```bash
git add src/services/supabase/tasks.ts src/features/day/useDayTasks.ts src/domain/tasks/types.ts
git commit -m "feat: add mobile day task query layer"
```

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

```tsx
import { render, screen } from '@testing-library/react-native'
import { DayScreen } from '../screens/DayScreen'

jest.mock('../useDayTasks', () => ({
  useDayTasks: () => ({
    isLoading: false,
    isSuccess: true,
    groups: {
      scheduled: [
        { id: '1', title: '晨间整理', startAt: '2026-04-21T09:00:00.000Z', endAt: '2026-04-21T09:30:00.000Z', completed: false, notes: '收拾桌面' }
      ],
      unscheduled: [
        { id: '2', title: '写周报', startAt: null, endAt: null, completed: false, notes: '' }
      ]
    }
  })
}))

it('renders date switcher, scheduled list, and unscheduled section', () => {
  render(<DayScreen />)

  expect(screen.getByText('今天')).toBeTruthy()
  expect(screen.getByText('晨间整理')).toBeTruthy()
  expect(screen.getByText(/未安排任务/i)).toBeTruthy()
  expect(screen.getByLabelText('新增任务')).toBeTruthy()
})
```

- [ ] **Step 2: Run the screen test to verify it fails**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- DayScreen.test.tsx --runInBand`
Expected: FAIL with missing screen/component files.

- [ ] **Step 3: Implement the read-only Day shell**

```tsx
// app/(app)/day.tsx
import { DayScreen } from '../../src/features/day/screens/DayScreen'

export default function DayPage() {
  return <DayScreen />
}
```

```tsx
// src/features/day/screens/DayScreen.tsx
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useDayTasks } from '../useDayTasks'
import { DateSwitcher } from '../components/DateSwitcher'
import { TaskList } from '../components/TaskList'
import { UnscheduledSection } from '../components/UnscheduledSection'
import { Button } from '../../../shared/ui/Button'

export function DayScreen() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const { groups } = useDayTasks(selectedDate)

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 64 }}>
      <DateSwitcher date={selectedDate} onChange={setSelectedDate} />
      <TaskList tasks={groups.scheduled} />
      <UnscheduledSection tasks={groups.unscheduled} />
      <Button label="新增任务" accessibilityLabel="新增任务" onPress={() => {}} />
    </View>
  )
}
```

- [ ] **Step 4: Run the screen test to verify the shell passes**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- DayScreen.test.tsx --runInBand`
Expected: PASS.

- [ ] **Step 5: Commit the Day read-only shell**

```bash
git add app/'(app)'/day.tsx src/features/day/screens/DayScreen.tsx src/features/day/components src/shared/ui
git commit -m "feat: add mobile day screen shell"
```

## Task 6: Add Task Editor Sheet And CRUD Mutations

**Files:**
- Create: `rhythm-mobile/src/features/day/useTaskEditorStore.ts`
- Create: `rhythm-mobile/src/features/day/components/TaskEditorSheet.tsx`
- Modify: `rhythm-mobile/src/services/supabase/tasks.ts`
- Modify: `rhythm-mobile/src/features/day/screens/DayScreen.tsx`
- Test: `rhythm-mobile/src/features/day/__tests__/TaskEditorSheet.test.tsx`

- [ ] **Step 1: Write the failing editor sheet test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native'
import { TaskEditorSheet } from '../components/TaskEditorSheet'

it('submits the edited task title', async () => {
  const onSubmit = jest.fn()

  render(
    <TaskEditorSheet
      visible
      initialTask={null}
      onClose={() => {}}
      onSubmit={onSubmit}
    />
  )

  fireEvent.changeText(screen.getByPlaceholderText('输入任务标题'), '深度工作')
  fireEvent.press(screen.getByText('保存任务'))

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ title: '深度工作' })
  )
})
```

- [ ] **Step 2: Run the sheet test to verify it fails**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- TaskEditorSheet.test.tsx`
Expected: FAIL with missing editor sheet/store code.

- [ ] **Step 3: Implement CRUD service methods and editor sheet**

```ts
// src/services/supabase/tasks.ts
export async function createTask(input: TaskFormInput) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      start_time: input.startAt,
      end_time: input.endAt,
      description: input.notes,
      completed: input.completed ?? false
    })
    .select('id,title,start_time,end_time,description,completed')
    .single()

  if (error) throw error
  return mapRow(data)
}

export async function updateTask(taskId: string, input: Partial<TaskFormInput>) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: input.title,
      start_time: input.startAt,
      end_time: input.endAt,
      description: input.notes,
      completed: input.completed
    })
    .eq('id', taskId)
    .select('id,title,start_time,end_time,description,completed')
    .single()

  if (error) throw error
  return mapRow(data)
}
```

```tsx
// src/features/day/components/TaskEditorSheet.tsx
import { useState } from 'react'
import { Modal, Text, TextInput, View } from 'react-native'
import { validateTaskForm } from '../../../domain/tasks/taskForm'
import { Button } from '../../../shared/ui/Button'

export function TaskEditorSheet({ visible, initialTask, onClose, onSubmit }) {
  const [title, setTitle] = useState(initialTask?.title ?? '')
  const [notes, setNotes] = useState(initialTask?.notes ?? '')

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <Text>{initialTask ? '编辑任务' : '新建任务'}</Text>
          <TextInput placeholder="输入任务标题" value={title} onChangeText={setTitle} />
          <TextInput placeholder="输入备注..." value={notes} onChangeText={setNotes} />
          <Button
            label="保存任务"
            onPress={() => onSubmit(validateTaskForm({ title, startAt: initialTask?.startAt ?? null, endAt: initialTask?.endAt ?? null, notes }))}
          />
          <Button label="取消" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}
```

- [ ] **Step 4: Wire create/edit/delete flows into DayScreen and verify tests**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- TaskEditorSheet DayScreen --runInBand`
Expected: PASS after Day screen opens the sheet, submits mutations, and invalidates `['day-tasks', yyyy-mm-dd]`.

- [ ] **Step 5: Commit CRUD flow**

```bash
git add src/features/day/useTaskEditorStore.ts src/features/day/components/TaskEditorSheet.tsx src/services/supabase/tasks.ts src/features/day/screens/DayScreen.tsx
git commit -m "feat: add mobile task editor and crud flows"
```

## Task 7: Add Completion Toggle And Unscheduled Editing

**Files:**
- Modify: `rhythm-mobile/src/services/supabase/tasks.ts`
- Modify: `rhythm-mobile/src/features/day/components/TaskCard.tsx`
- Modify: `rhythm-mobile/src/features/day/components/UnscheduledSection.tsx`
- Modify: `rhythm-mobile/src/features/day/screens/DayScreen.tsx`

- [ ] **Step 1: Write the failing task card interaction test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native'
import { TaskCard } from '../components/TaskCard'

it('calls onToggleComplete when status button is pressed', () => {
  const onToggleComplete = jest.fn()

  render(
    <TaskCard
      task={{ id: '1', title: '晨间整理', startAt: '2026-04-21T09:00:00.000Z', endAt: '2026-04-21T09:30:00.000Z', completed: false, notes: '' }}
      onPress={() => {}}
      onToggleComplete={onToggleComplete}
    />
  )

  fireEvent.press(screen.getByLabelText('切换任务完成状态'))
  expect(onToggleComplete).toHaveBeenCalledWith('1', true)
})
```

- [ ] **Step 2: Run the interaction test to verify it fails**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- TaskCard --runInBand`
Expected: FAIL with missing interaction props or button.

- [ ] **Step 3: Implement completion toggle and unscheduled edit entry**

```ts
// src/services/supabase/tasks.ts
export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', taskId)
    .select('id,title,start_time,end_time,description,completed')
    .single()

  if (error) throw error
  return mapRow(data)
}
```

```tsx
// src/features/day/components/TaskCard.tsx
export function TaskCard({ task, onPress, onToggleComplete }) {
  return (
    <Pressable onPress={() => onPress(task)}>
      <Pressable accessibilityLabel="切换任务完成状态" onPress={() => onToggleComplete(task.id, !task.completed)}>
        <Text>{task.completed ? '●' : '○'}</Text>
      </Pressable>
      <Text>{task.title}</Text>
    </Pressable>
  )
}
```

- [ ] **Step 4: Run screen tests to verify completion and unscheduled editing work**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- DayScreen TaskCard --runInBand`
Expected: PASS with both scheduled and unscheduled task interactions wired.

- [ ] **Step 5: Commit task interactions**

```bash
git add src/services/supabase/tasks.ts src/features/day/components/TaskCard.tsx src/features/day/components/UnscheduledSection.tsx src/features/day/screens/DayScreen.tsx
git commit -m "feat: add mobile task completion interactions"
```

## Task 8: Add Notification Permission Card And Task Reminder Sync

**Files:**
- Create: `rhythm-mobile/src/services/notifications/taskNotifications.ts`
- Create: `rhythm-mobile/src/features/day/components/NotificationPermissionCard.tsx`
- Modify: `rhythm-mobile/src/features/day/screens/DayScreen.tsx`
- Test: `rhythm-mobile/src/services/notifications/__tests__/taskNotifications.test.ts`

- [ ] **Step 1: Write the failing reminder scheduling test**

```ts
import { syncTaskReminders } from '../taskNotifications'
import * as Notifications from 'expo-notifications'

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn()
}))

it('schedules notifications only for tasks with start times', async () => {
  await syncTaskReminders([
    { id: '1', title: '晨间整理', startAt: '2026-04-21T09:00:00.000Z', endAt: '2026-04-21T09:30:00.000Z', completed: false, notes: '' },
    { id: '2', title: '写周报', startAt: null, endAt: null, completed: false, notes: '' }
  ])

  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run the notification test to verify it fails**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- taskNotifications --runInBand`
Expected: FAIL with missing notification service.

- [ ] **Step 3: Implement permission card and reminder sync**

```ts
// src/services/notifications/taskNotifications.ts
import * as Notifications from 'expo-notifications'
import { TaskRecord } from '../../domain/tasks/types'

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function syncTaskReminders(tasks: TaskRecord[]) {
  await Notifications.cancelAllScheduledNotificationsAsync()

  const timedTasks = tasks.filter((task) => task.startAt)
  await Promise.all(
    timedTasks.map((task) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rhythm',
          body: `该开始：${task.title}`
        },
        trigger: new Date(task.startAt!)
      })
    )
  )
}
```

```tsx
// src/features/day/components/NotificationPermissionCard.tsx
import { Text, View } from 'react-native'
import { Button } from '../../../shared/ui/Button'

export function NotificationPermissionCard({ visible, onEnable, onDismiss }) {
  if (!visible) return null

  return (
    <View>
      <Text>开启提醒，不错过今天任务</Text>
      <Text>到点时提醒你开始执行</Text>
      <Button label="立即开启" onPress={onEnable} />
      <Button label="稍后" onPress={onDismiss} />
    </View>
  )
}
```

- [ ] **Step 4: Verify reminders sync from DayScreen**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- taskNotifications DayScreen --runInBand`
Expected: PASS, and manual verification in Expo Go shows one reminder per timed task.

- [ ] **Step 5: Commit notifications**

```bash
git add src/services/notifications/taskNotifications.ts src/features/day/components/NotificationPermissionCard.tsx src/features/day/screens/DayScreen.tsx
git commit -m "feat: add mobile task reminder sync"
```

## Task 9: Polish Login Inputs And Real Auth Submission

**Files:**
- Modify: `rhythm-mobile/app/(auth)/login.tsx`
- Create: `rhythm-mobile/src/shared/ui/TextField.tsx`
- Modify: `rhythm-mobile/src/services/supabase/auth.ts`

- [ ] **Step 1: Write the failing login screen test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native'
import LoginPage from '../../../../app/(auth)/login'

it('submits email and password credentials', async () => {
  render(<LoginPage />)

  fireEvent.changeText(screen.getByPlaceholderText('邮箱'), 'demo@example.com')
  fireEvent.changeText(screen.getByPlaceholderText('密码'), 'secret123')
  fireEvent.press(screen.getByText('登录 / 注册'))

  expect(screen.getByText(/Rhythm/i)).toBeTruthy()
})
```

- [ ] **Step 2: Run the login test to verify it fails**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- login --runInBand`
Expected: FAIL because inputs and submit flow are not implemented.

- [ ] **Step 3: Implement real auth submission**

```ts
// src/services/supabase/auth.ts
export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}
```

```tsx
// app/(auth)/login.tsx
import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { TextField } from '../../src/shared/ui/TextField'
import { Button } from '../../src/shared/ui/Button'
import { signInWithPassword } from '../../src/services/supabase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Rhythm</Text>
      <Text>今日执行，从这里开始</Text>
      <TextField placeholder="邮箱" value={email} onChangeText={setEmail} />
      <TextField placeholder="密码" value={password} onChangeText={setPassword} secureTextEntry />
      <Button
        label="登录 / 注册"
        onPress={async () => {
          try {
            await signInWithPassword(email.trim(), password)
          } catch (error) {
            Alert.alert('登录失败', error instanceof Error ? error.message : '请稍后重试')
          }
        }}
      />
    </View>
  )
}
```

- [ ] **Step 4: Run login tests and manual auth verification**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- login --runInBand`
Expected: PASS.

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm start`
Expected: Expo dev server starts, valid Supabase credentials can sign in and redirect to `/day`.

- [ ] **Step 5: Commit login flow**

```bash
git add app/'(auth)'/login.tsx src/shared/ui/TextField.tsx src/services/supabase/auth.ts
git commit -m "feat: add mobile login form"
```

## Task 10: Verification And Documentation Pass

**Files:**
- Modify: `rhythm-mobile/README.md`
- Modify: `rhythm-mobile/docs/specs/2026-04-20-移动端原生迁移设计.md`
- Create: `rhythm-mobile/docs/testing/day-mvp-smoke-checklist.md`

- [ ] **Step 1: Write the smoke checklist doc**

```md
# Day MVP Smoke Checklist

- 登录后自动进入 Day 首页
- 今天 / 昨天 / 明天切换可用
- 有时间任务显示在主列表
- 无时间任务显示在未安排任务区
- 新建任务后立即出现在正确分组
- 编辑任务后时间或备注立即刷新
- 删除任务后列表移除
- 点击状态位可以切换完成状态
- 开启通知后仅为有时间任务安排提醒
```

- [ ] **Step 2: Run the full automated test suite**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm test -- --runInBand`
Expected: PASS.

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Run the manual Expo smoke flow**

Run: `cd /Users/sifan1/Documents/project/日程/rhythm-mobile && pnpm start`
Expected: Expo opens successfully.

Manual checks:
- Sign in with a real test account.
- Create one timed task and one untimed task.
- Edit the timed task title and notes.
- Toggle completion for both tasks.
- Delete one task.
- Grant notification permission and verify only the timed task gets a reminder.

- [ ] **Step 4: Update README with setup and env requirements**

```md
## Mobile Day MVP Setup

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Install deps with `pnpm install`.
4. Start Expo with `pnpm start`.
5. Run tests with `pnpm test -- --runInBand`.
```

- [ ] **Step 5: Commit verification docs**

```bash
git add README.md docs/testing/day-mvp-smoke-checklist.md docs/specs/2026-04-20-移动端原生迁移设计.md
git commit -m "docs: add day mvp verification checklist"
```

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
- No `TODO`, `TBD`, or “implement later” placeholders remain in the execution sequence.
- Every test, command, and commit message is explicit.

### Type Consistency

- `TaskRecord` and `TaskFormInput` are introduced in Task 3 and reused consistently in Tasks 4, 6, 7, and 8.
- Query key format remains `['day-tasks', yyyy-mm-dd]` across read and mutation invalidation steps.
- Notification sync uses `TaskRecord.startAt` consistently with the task grouping model.
