import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, View } from 'react-native'
import { Plus } from 'lucide-react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import type { TaskFormInput, TaskRecord } from '@/domain/tasks/types'
import { DateSwitcher } from '../components/DateSwitcher'
import { ExecutionReadonlySheet } from '../components/ExecutionReadonlySheet'
import { ExecutionTimeline } from '../components/ExecutionTimeline'
import { TaskEditorSheet } from '../components/TaskEditorSheet'
import { TodayProgressCard } from '../components/TodayProgressCard'
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

  // 进度统计涵盖时间轴与收集箱全部条目
  const allItems = [...scheduledItems, ...unscheduledItems]
  const totalCount = allItems.length
  const completedCount = allItems.filter((item) => item.completed).length

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
      {/* 顶部日期栏 */}
      <DateSwitcher date={currentDate} onChange={setCurrentDate} />

      {/* 数据同步异常提示 */}
      {errors.length > 0 ? (
        <Card className="mx-5 mb-2 border-destructive/20 bg-destructive/5 py-0 shadow-none">
          <CardContent className="flex-row items-center justify-between px-3 py-2.5">
            <Text className="font-semibold text-danger">部分数据同步失败</Text>
            <Button onPress={refetchAll} size="sm" variant="ghost">
              <Text className="text-danger">重试</Text>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* 主体：进度卡 + 时间轴 + 收集箱 */}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {isLoading ? <ActivityIndicator /> : null}

        {totalCount > 0 ? <TodayProgressCard total={totalCount} completed={completedCount} /> : null}

        <ExecutionTimeline items={scheduledItems} onPressItem={handlePressItem} onToggleItem={toggleItem} />
        <UnscheduledSection items={unscheduledItems} onPressItem={handlePressItem} onToggleItem={toggleItem} />
      </ScrollView>

      {/* 新建任务悬浮按钮 */}
      <Pressable
        accessibilityLabel="新增任务"
        onPress={openNewTask}
        className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-black/25 active:bg-primary/90"
      >
        <Plus size={26} strokeWidth={2.5} className="text-primary-foreground" />
      </Pressable>

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
