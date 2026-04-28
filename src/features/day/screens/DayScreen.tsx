import { ActivityIndicator, SafeAreaView, ScrollView, View } from 'react-native'
import { Button } from '@/components/ui/button'
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
        <View className="mx-5 mb-2 flex-row items-center justify-between rounded-lg bg-[#FFF0ED] p-3">
          <Text className="font-bold text-danger">部分数据同步失败</Text>
          <Button className="h-8 bg-transparent px-2 shadow-none" onPress={refetchAll} variant="ghost">
            <Text className="font-extrabold text-danger">重试</Text>
          </Button>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {isLoading ? <ActivityIndicator /> : null}

        <ExecutionTimeline items={scheduledItems} onPressItem={handlePressItem} onToggleItem={toggleItem} />
        <UnscheduledSection items={unscheduledItems} onPressItem={handlePressItem} onToggleItem={toggleItem} />
      </ScrollView>

      <Button
        accessibilityLabel="新增任务"
        className="absolute bottom-6 right-5 rounded-lg bg-accent px-4 py-3 shadow-none"
        onPress={openNewTask}
      >
        <Text className="font-extrabold text-white">＋新建任务</Text>
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
