import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import { SourceBadge } from './SourceBadge'

type ExecutionReadonlySheetProps = {
  visible: boolean
  item: DayExecutionItem | null
  onClose: () => void
  onToggle: (item: DayExecutionItem) => void
}

export function ExecutionReadonlySheet({ visible, item, onClose, onToggle }: ExecutionReadonlySheetProps) {
  if (!item) return null

  const timeText = item.startAt && item.endAt ? `${item.startAt} - ${item.endAt}` : '未安排时间'

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <SourceBadge source={item.source} label={item.categoryLabel} />
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>时间：{timeText}</DialogDescription>
        </DialogHeader>

        {item.description ? <Text className="text-sm leading-5">{item.description}</Text> : null}

        <View className="flex-row items-center justify-end gap-2 pt-2">
          <Button onPress={onClose} variant="ghost">
            <Text>关闭</Text>
          </Button>
          <Button onPress={() => onToggle(item)}>
            <Text>{item.completed ? '取消完成' : '标记完成'}</Text>
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  )
}
