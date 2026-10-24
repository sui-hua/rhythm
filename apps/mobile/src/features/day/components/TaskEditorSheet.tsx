import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Text } from '@/components/ui/text'
import type { TaskFormInput, TaskRecord } from '@/domain/tasks/types'

type TaskEditorSheetProps = {
  visible: boolean
  task: TaskRecord | null
  date: Date
  isSaving: boolean
  onClose: () => void
  onSave: (input: TaskFormInput, taskId: string | null) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

export function TaskEditorSheet({ visible, task, date, isSaving, onClose, onSave, onDelete }: TaskEditorSheetProps) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!visible) return

    setTitle(task?.title ?? '')
    setStartTime(toClock(task?.startAt) ?? '09:00')
    setEndTime(toClock(task?.endAt) ?? '10:00')
    setNotes(task?.notes ?? '')
    setError('')
  }, [visible, task])

  async function handleSave() {
    try {
      await onSave(
        {
          title,
          startAt: mergeDateAndClock(date, startTime),
          endAt: mergeDateAndClock(date, endTime),
          notes,
          completed: task?.completed ?? false
        },
        task?.id ?? null
      )
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败，请重试')
    }
  }

  async function handleDelete() {
    if (!task) return

    try {
      await onDelete(task.id)
      onClose()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败，请重试')
    }
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? '编辑任务' : '新建任务'}</DialogTitle>
        </DialogHeader>

        <View className="gap-3">
          <Label>标题</Label>
          <Input placeholder="输入任务标题" value={title} onChangeText={setTitle} />

          <Label>开始时间</Label>
          <Input placeholder="09:00" value={startTime} onChangeText={setStartTime} />

          <Label>结束时间</Label>
          <Input placeholder="10:00" value={endTime} onChangeText={setEndTime} />

          <Label>备注</Label>
          <Textarea placeholder="补充说明" value={notes} onChangeText={setNotes} />
        </View>

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <View className="flex-row items-center justify-end gap-2 pt-2">
          {task ? (
            <Button className="mr-auto" disabled={isSaving} onPress={handleDelete} variant="ghost">
              <Text className="text-danger">删除任务</Text>
            </Button>
          ) : null}
          <Button disabled={isSaving} onPress={onClose} variant="ghost">
            <Text>取消</Text>
          </Button>
          <Button disabled={isSaving} onPress={handleSave}>
            <Text>{isSaving ? '保存中' : '保存'}</Text>
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  )
}

function toClock(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function mergeDateAndClock(date: Date, clock: string) {
  const [hourText, minuteText] = clock.split(':')
  const next = new Date(date)
  next.setHours(Number(hourText), Number(minuteText), 0, 0)
  return next.toISOString()
}
