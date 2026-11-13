import React, { useRef, useEffect } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

interface TimelineRibbonProps {
  time: string // 'HH:mm'
  duration: number // 分钟数
  onChangeTime: (time: string) => void
  onChangeDuration: (duration: number) => void
}

// 生成一天内以 15 分钟为间隔的所有时刻 (00:00 ~ 23:45, 共 96 个刻度)
const TIME_SLOTS: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    TIME_SLOTS.push(`${hh}:${mm}`)
  }
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90]

// 获取最接近当前时间的 15 分钟刻度
export const getNearestCurrentTime = (): string => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const rounded = Math.round(minutes / 15) * 15
  const finalH = (hours + Math.floor(rounded / 60)) % 24
  const finalM = rounded % 60
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`
}

// 计算结束时间
export const calculateEndTime = (startTime: string, durationMin: number): string => {
  if (!startTime) return '09:30'
  const [hStr, mStr] = startTime.split(':')
  const h = parseInt(hStr, 10) || 0
  const m = parseInt(mStr, 10) || 0
  const total = h * 60 + m + durationMin
  const endH = Math.floor(total / 60) % 24
  const endM = total % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

export const TimelineRibbon: React.FC<TimelineRibbonProps> = ({
  time,
  duration,
  onChangeTime,
  onChangeDuration
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 结束时间计算
  const endTime = calculateEndTime(time, duration)

  // 滚动并居中当前选中的时间槽
  const scrollToActiveSlot = (targetTime: string, smooth = true) => {
    if (!scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-time="${targetTime}"]`) as HTMLElement | null
    if (el) {
      const container = scrollRef.current
      const left = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
      container.scrollTo({
        left,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  }

  // 初次渲染以及外部 time 变化时居中
  useEffect(() => {
    scrollToActiveSlot(time, false)
  }, [time])

  // 快调步进（以 15 分钟为一步）
  const handleStep = (direction: -1 | 1) => {
    const currentIndex = TIME_SLOTS.indexOf(time)
    if (currentIndex === -1) {
      onChangeTime(TIME_SLOTS[0])
      return
    }
    const nextIndex = (currentIndex + direction + TIME_SLOTS.length) % TIME_SLOTS.length
    const nextTime = TIME_SLOTS[nextIndex]
    onChangeTime(nextTime)
    scrollToActiveSlot(nextTime, true)
  }

  // 跳转到当下时刻
  const handleJumpToNow = () => {
    const nowTime = getNearestCurrentTime()
    onChangeTime(nowTime)
    scrollToActiveSlot(nowTime, true)
  }

  // 支持鼠标滚轮水平滑动
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-3 select-none">
      {/* 顶部行：时间段显示 + 现在时刻快捷定位 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-zinc-400">时序区间</span>
          <div className="flex items-center gap-1 bg-white border border-zinc-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
            <span className="text-xs font-mono font-bold text-zinc-900">{time}</span>
            <ArrowRight size={11} className="text-zinc-400 stroke-[2.5]" />
            <span className="text-xs font-mono font-bold text-zinc-600">{endTime}</span>
            <span className="text-[10px] font-mono font-medium text-zinc-400 ml-0.5">({duration}m)</span>
          </div>
        </div>

        {/* 快速定位「当下时刻」按钮 */}
        <button
          type="button"
          onClick={handleJumpToNow}
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 bg-white border border-zinc-200/80 hover:bg-zinc-100 text-zinc-700 rounded-lg shadow-2xs transition-colors cursor-pointer active:scale-95"
          title="跳转至当前时间"
        >
          <Zap size={11} className="text-zinc-800 fill-zinc-800" />
          <span>现在</span>
        </button>
      </div>

      {/* 中部：横向时序刻度滑尺 (Timeline Ribbon) */}
      <div className="relative group">
        {/* 左边缘淡出渐变 */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-50 to-transparent pointer-events-none z-10" />

        {/* 右边缘淡出渐变 */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-50 to-transparent pointer-events-none z-10" />

        {/* 刻度滑尺容器（支持移动端惯性滑动与居中吸附） */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 px-[calc(50%-28px)] scroll-smooth snap-x snap-mandatory"
        >
          {TIME_SLOTS.map((slot) => {
            const isSelected = slot === time
            const isHour = slot.endsWith(':00')
            const isHalf = slot.endsWith(':30')

            return (
              <button
                key={slot}
                type="button"
                data-time={slot}
                onClick={() => {
                  onChangeTime(slot)
                  scrollToActiveSlot(slot, true)
                }}
                className={cn(
                  'shrink-0 snap-center flex flex-col items-center justify-center transition-all cursor-pointer rounded-xl',
                  isSelected
                    ? 'bg-zinc-900 text-white font-mono font-bold px-3 py-1.5 shadow-xs scale-105'
                    : isHour
                      ? 'bg-white border border-zinc-200/90 text-zinc-800 font-mono font-semibold px-2.5 py-1 hover:border-zinc-400 hover:bg-zinc-100/60 shadow-2xs'
                      : isHalf
                        ? 'bg-white/60 border border-zinc-200/60 text-zinc-600 font-mono text-xs px-2 py-1 hover:bg-white hover:text-zinc-900'
                        : 'text-zinc-400 hover:text-zinc-700 font-mono text-[11px] px-1.5 py-1 hover:bg-zinc-100/70'
                )}
              >
                {/* 刻度小触点 */}
                <span
                  className={cn(
                    'w-1 h-1 rounded-full mb-0.5 transition-colors',
                    isSelected
                      ? 'bg-white'
                      : isHour
                        ? 'bg-zinc-900'
                        : isHalf
                          ? 'bg-zinc-400'
                          : 'bg-zinc-200'
                  )}
                />
                <span className="text-[11px] tracking-tight">{slot}</span>
              </button>
            )
          })}
        </div>

        {/* 左右步进快捷小按钮 */}
        <div className="flex items-center justify-between pt-1 px-1">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            className="flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer py-0.5 px-1 rounded active:scale-95"
          >
            <ChevronLeft size={12} />
            <span>-15分</span>
          </button>
          <span className="text-[10px] text-zinc-400 font-normal">滑动刻度或点击选取时刻</span>
          <button
            type="button"
            onClick={() => handleStep(1)}
            className="flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer py-0.5 px-1 rounded active:scale-95"
          >
            <span>+15分</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* 底部行：持续时长胶囊选择 */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50">
        <span className="text-[11px] font-semibold text-zinc-400">持续时长</span>
        <div className="flex items-center gap-1.5">
          {DURATION_OPTIONS.map((dur) => (
            <button
              key={dur}
              type="button"
              onClick={() => onChangeDuration(dur)}
              className={cn(
                'px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer',
                duration === dur
                  ? 'bg-zinc-900 text-white font-bold shadow-xs'
                  : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              {dur}分
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
