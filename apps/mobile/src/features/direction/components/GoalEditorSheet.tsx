import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import type { GoalCategory, GoalInput } from '@/services/api/goals'

type GoalEditorSheetProps = {
  visible: boolean
  categories: GoalCategory[]
  isSaving: boolean
  onClose: () => void
  onSave: (input: GoalInput) => Promise<void>
}

// 新建目标弹层：标题 + 分类 + 描述，写入 goal 表
export function GoalEditorSheet({ visible, categories, isSaving, onClose, onSave }: GoalEditorSheetProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function reset() {
    setTitle('')
    setDescription('')
    setCategoryId(null)
    setError('')
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('请输入目标名称')
      return
    }

    setError('')

    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId
      })
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-left text-xl font-bold tracking-tight">新建目标</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium">名称</Text>
            <Input className="h-11 rounded-xl" placeholder="例如：提升设计专业能力" value={title} onChangeText={setTitle} />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium">分类</Text>
            {categories.length === 0 ? (
              <Text className="text-xs text-muted-foreground">暂无分类，可先创建分类后再归类</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {categories.map((category) => {
                  const active = categoryId === category.id
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setCategoryId(active ? null : category.id)}
                      className={cn('rounded-full px-3.5 py-1.5', active ? 'bg-primary' : 'bg-secondary active:bg-secondary/80')}
                    >
                      <Text
                        className={cn(
                          'text-xs font-semibold',
                          active ? 'text-primary-foreground' : 'text-secondary-foreground'
                        )}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium">描述</Text>
            <Input className="h-11 rounded-xl" placeholder="例如：界面临摹" value={description} onChangeText={setDescription} />
          </View>

          {error ? <Text className="text-sm text-danger">{error}</Text> : null}

          <View className="flex-row justify-end gap-3">
            <Button
              variant="secondary"
              className="rounded-xl px-6"
              onPress={() => {
                reset()
                onClose()
              }}
            >
              <Text>取消</Text>
            </Button>
            <Button className="rounded-xl px-6" disabled={isSaving} onPress={() => void handleSave()}>
              <Text>{isSaving ? '保存中…' : '保存'}</Text>
            </Button>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  )
}
