import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import type { HabitFrequency } from '@/domain/day/types'
import { cn } from '@/lib/utils'
import type { HabitInput } from '@/services/api/habits'

type FrequencyKind = HabitFrequency['type']

const FREQUENCY_OPTIONS: { value: FrequencyKind; label: string }[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' }
]

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

type HabitEditorSheetProps = {
  visible: boolean
  isSaving: boolean
  onClose: () => void
  onSave: (input: HabitInput) => Promise<void>
}

// 新建习惯弹层：名称 + 频率 + 目标值，写入后端 habit 表
export function HabitEditorSheet({ visible, isSaving, onClose, onSave }: HabitEditorSheetProps) {
  const [title, setTitle] = useState('')
  const [frequencyKind, setFrequencyKind] = useState<FrequencyKind>('daily')
  // 0=周日 … 6=周六，与 Date.getDay() 一致
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5])
  const [monthDay, setMonthDay] = useState('1')
  const [targetValue, setTargetValue] = useState('1')
  const [error, setError] = useState('')

  function reset() {
    setTitle('')
    setFrequencyKind('daily')
    setWeekdays([1, 3, 5])
    setMonthDay('1')
    setTargetValue('1')
    setError('')
  }

  function buildFrequency(): HabitFrequency | null {
    if (frequencyKind === 'daily') return { type: 'daily' }

    if (frequencyKind === 'weekly') {
      const sorted = [...weekdays].sort((a, b) => a - b)
      return sorted.length > 0 ? { type: 'weekly', weekdays: sorted } : null
    }

    const day = Number(monthDay)
    if (!Number.isInteger(day) || day < 1 || day > 31) return null
    return { type: 'monthly', monthDays: [day] }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('请输入习惯名称')
      return
    }

    const frequency = buildFrequency()
    if (!frequency) {
      setError(frequencyKind === 'weekly' ? '请至少选择一个星期' : '请输入 1–31 之间的日期')
      return
    }

    const parsedTarget = Number(targetValue)
    setError('')

    try {
      await onSave({
        title: title.trim(),
        frequency,
        target_value: Number.isFinite(parsedTarget) && parsedTarget >= 1 ? Math.floor(parsedTarget) : 1
      })
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  function toggleWeekday(value: number) {
    setWeekdays((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
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
          <DialogTitle className="text-left text-xl font-bold tracking-tight">新建习惯</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium">名称</Text>
            <Input className="h-11 rounded-xl" placeholder="例如：每天喝水" value={title} onChangeText={setTitle} />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium">频率</Text>
            <View className="flex-row gap-2">
              {FREQUENCY_OPTIONS.map((option) => {
                const active = frequencyKind === option.value
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setFrequencyKind(option.value)}
                    className={cn(
                      'rounded-full px-4 py-1.5',
                      active ? 'bg-primary' : 'bg-secondary active:bg-secondary/80'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        active ? 'text-primary-foreground' : 'text-secondary-foreground'
                      )}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {/* 每周：选择星期（0=周日 … 6=周六） */}
            {frequencyKind === 'weekly' ? (
              <View className="mt-1 flex-row gap-1.5">
                {WEEKDAY_LABELS.map((label, index) => {
                  const value = index === 6 ? 0 : index + 1
                  const active = weekdays.includes(value)
                  return (
                    <Pressable
                      key={label}
                      accessibilityLabel={`星期${label}`}
                      onPress={() => toggleWeekday(value)}
                      className={cn(
                        'h-9 flex-1 items-center justify-center rounded-full',
                        active ? 'bg-primary' : 'bg-secondary active:bg-secondary/80'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-xs font-semibold',
                          active ? 'text-primary-foreground' : 'text-secondary-foreground'
                        )}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}

            {/* 每月：填写日期 */}
            {frequencyKind === 'monthly' ? (
              <Input
                className="mt-1 h-11 rounded-xl"
                placeholder="每月第几天（1–31）"
                keyboardType="number-pad"
                value={monthDay}
                onChangeText={setMonthDay}
              />
            ) : null}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium">目标值</Text>
            <Input
              className="h-11 rounded-xl"
              placeholder="例如：1（次数）"
              keyboardType="number-pad"
              value={targetValue}
              onChangeText={setTargetValue}
            />
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
