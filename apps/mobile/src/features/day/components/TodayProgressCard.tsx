import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Text } from '@/components/ui/text'

type TodayProgressCardProps = {
  total: number
  completed: number
}

const RING_SIZE = 84
const STROKE_WIDTH = 8
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center gap-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-2xl font-extrabold tracking-tight">{value}</Text>
    </View>
  )
}

// 今日进度卡：环形完成率 + 已完成/待完成/总任务统计（设计稿顶部卡片）
export function TodayProgressCard({ total, completed }: TodayProgressCardProps) {
  const pending = total - completed
  const ratio = total > 0 ? completed / total : 0

  return (
    <View className="mx-5 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm shadow-black/5">
      <Text className="text-sm font-semibold text-muted-foreground">今日进度</Text>

      <View className="mt-3 flex-row items-center gap-6">
        {/* 环形进度：逆时针转 90° 让起笔位于顶部 */}
        <View
          className="h-[84px] w-[84px] items-center justify-center"
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <View className="absolute items-center justify-center" style={{ transform: [{ rotate: '90deg' }] }}>
            <Text className="text-lg font-extrabold tracking-tight">
              {Math.round(ratio * 100)}%
            </Text>
          </View>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke="#e4e4e7" strokeWidth={STROKE_WIDTH} fill="none" />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#18181b"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
              strokeLinecap="round"
            />
          </Svg>
        </View>

        <View className="flex-1 flex-row items-center justify-between">
          <Stat label="已完成" value={completed} />
          <View className="h-10 w-px bg-border" />
          <Stat label="待完成" value={pending} />
          <View className="h-10 w-px bg-border" />
          <Stat label="总任务" value={total} />
        </View>
      </View>
    </View>
  )
}
