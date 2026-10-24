import { useState } from 'react'
import { View } from 'react-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { useMockStore } from '@/mocks/store'

type HabitEditorSheetProps = {
  visible: boolean
  onClose: () => void
}

// 新建习惯弹层：标题 + 频率描述，写入 mock store
export function HabitEditorSheet({ visible, onClose }: HabitEditorSheetProps) {
  const addHabit = useMockStore((state) => state.addHabit)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  function handleSave() {
    if (!title.trim()) {
      setError('请输入习惯名称')
      return
    }
    addHabit({ title: title.trim(), description: description.trim() })
    setTitle('')
    setDescription('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-left text-xl font-bold tracking-tight">新建习惯</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium">名称</Text>
            <Input className="h-11 rounded-xl" placeholder="例如：每天喝水" value={title} onChangeText={setTitle} />
          </View>
          <View className="gap-2">
            <Text className="text-sm font-medium">频率说明</Text>
            <Input className="h-11 rounded-xl" placeholder="例如：每天 30 分钟" value={description} onChangeText={setDescription} />
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
