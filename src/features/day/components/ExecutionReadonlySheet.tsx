import { Modal, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/25">
        <Card className="rounded-t-lg border-x-0 border-b-0 bg-card py-0 shadow-none">
          <CardContent className="gap-3 px-5 py-5">
          <SourceBadge source={item.source} label={item.categoryLabel} />
            <Text className="text-[20px] font-extrabold text-foreground">{item.title}</Text>
            <Text className="text-sm font-bold text-[#625C52]">时间：{timeText}</Text>
            {item.description ? (
              <Text className="text-sm leading-5 text-[#625C52]">{item.description}</Text>
            ) : null}

            <View className="flex-row items-center justify-end gap-2 pt-2">
              <Button onPress={onClose} variant="ghost">
                <Text className="font-bold text-muted">关闭</Text>
              </Button>
              <Button onPress={() => onToggle(item)}>
                <Text className="font-extrabold text-white">
                  {item.completed ? '取消完成' : '标记完成'}
                </Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </Modal>
  )
}
