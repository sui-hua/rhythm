import { ActivityIndicator, SafeAreaView, ScrollView, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import type { TaskFormInput, TaskRecord } from '@/domain/tasks/types'
import { DateSwitcher } from '../components/DateSwitcher'
import { ExecutionReadonlySheet } from '../components/ExecutionReadonlySheet'
import { ExecutionTimeline } from '../components/ExecutionTimeline'
import { TaskEditorSheet } from '../components/TaskEditorSheet'
import { UnscheduledSection } from '../components/UnscheduledSection'
import { useDayExecutionItems } from '../hooks/useDayExecutionItems'
import { useDayScreenState } from '../hooks/useDayScreenState'
import { useExecutionItemToggle } from '../hooks/useExecutionItemToggle'
import { useTaskMutations } from '../hooks/useTaskMutations'

export function DayScreen() {
  const currentDate = useDayScreenState((state) => state.currentDate)
  const setCurrentDate = useDayScreenState((state) => state.setCurrentDate)
  const editingTask = useDayScreenState((state) => state.editingTask)
  const readonlyItem = useDayScreenState((state) => state.readonlyItem)
  const isTaskEditorOpen = useDayScreenState((state) => state.isTaskEditorOpen)
  const isReadonlySheetOpen = useDayScreenState((state) => state.isReadonlySheetOpen)
  const openNewTask = useDayScreenState((state) => state.openNewTask)
  const openEditTask = useDayScreenState((state) => state.openEditTask)
  const closeTaskEditor = useDayScreenState((state) => state.closeTaskEditor)
  const openReadonlyItem = useDayScreenState((state) => state.openReadonlyItem)
  const closeReadonlySheet = useDayScreenState((state) => state.closeReadonlySheet)

  const { scheduledItems, unscheduledItems, isLoading, errors, refetchAll } = useDayExecutionItems(currentDate)
  const { toggleItem } = useExecutionItemToggle(currentDate)
  const { createTask, updateTask, deleteTask, isSaving } = useTaskMutations(currentDate)

  function handlePressItem(item: DayExecutionItem) {
    if (item.source === 'task') {
      openEditTask(item.original as TaskRecord)
      return
    }

    openReadonlyItem(item)
  }

  async function handleSaveTask(input: TaskFormInput, taskId: string | null) {
    if (taskId) {
      await updateTask({ taskId, input })
      return
    }

    await createTask(input)
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <DateSwitcher date={currentDate} onChange={setCurrentDate} />

      {errors.length > 0 ? (
        <Card className="mx-5 mb-2 border-danger/30 bg-[#FFF0ED] py-0 shadow-none">
          <CardContent className="flex-row items-center justify-between px-3 py-3">
            <Text className="font-semibold text-danger">部分数据同步失败</Text>
            <Button onPress={refetchAll} size="sm" variant="ghost">
              <Text className="text-danger">重试</Text>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {isLoading ? <ActivityIndicator /> : null}

        <ExecutionTimeline items={scheduledItems} onPressItem={handlePressItem} onToggleItem={toggleItem} />
        <UnscheduledSection items={unscheduledItems} onPressItem={handlePressItem} onToggleItem={toggleItem} />
      </ScrollView>

      <Button
        accessibilityLabel="新增任务"
        className="absolute bottom-6 right-5"
        onPress={openNewTask}
      >
        <Text>＋新建任务</Text>
      </Button>

      <TaskEditorSheet
        visible={isTaskEditorOpen}
        task={editingTask}
        date={currentDate}
        isSaving={isSaving}
        onClose={closeTaskEditor}
        onSave={handleSaveTask}
        onDelete={deleteTask}
      />

      <ExecutionReadonlySheet
        visible={isReadonlySheetOpen}
        item={readonlyItem}
        onClose={closeReadonlySheet}
        onToggle={toggleItem}
      />
    </SafeAreaView>
  )
}
