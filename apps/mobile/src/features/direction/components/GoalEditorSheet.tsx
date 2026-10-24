import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/mocks/data'
import { useMockStore } from '@/mocks/store'

type GoalEditorSheetProps = {
  visible: boolean
  onClose: () => void
}

// 新建目标弹层：标题 + 分类 + 描述，写入 mock store
export function GoalEditorSheet({ visible, onClose }: GoalEditorSheetProps) {
  const addGoal = useMockStore((state) => state.addGoal)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id)
  const [error, setError] = useState('')

  function handleSave() {
    if (!title.trim()) {
      setError('请输入目标名称')
      return
    }
    addGoal({ title: title.trim(), description: description.trim() || '新目标', categoryId })
    setTitle('')
    setDescription('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
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
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const active = categoryId === category.id
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    className={cn('rounded-full px-3.5 py-1.5', active ? 'bg-primary' : 'bg-secondary active:bg-secondary/80')}
                  >
                    <Text className={cn('text-xs font-semibold', active ? 'text-primary-foreground' : 'text-secondary-foreground')}>
                      {category.name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium">描述</Text>
            <Input className="h-11 rounded-xl" placeholder="例如：界面临摹" value={description} onChangeText={setDescription} />
          </View>

          {error ? <Text className="text-sm text-danger">{error}</Text> : null}

          <View className="flex-row justify-end gap-3">
            <Button variant="secondary" className="rounded-xl px-6" onPress={onClose}>
              <Text>取消</Text>
            </Button>
            <Button className="rounded-xl px-6" onPress={handleSave}>
              <Text>保存</Text>
            </Button>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  )
}
