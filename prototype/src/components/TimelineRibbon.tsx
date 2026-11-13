import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Zap } from 'lucide-react'
import { cn } from '../lib/utils'

interface TimelineRibbonProps {
  time: string // 'HH:mm'
  duration: number // 分钟数
  onChangeTime: (time: string) => void
  onChangeDuration: (duration: number) => void
}

// 刻度步长：5 分钟一个刻度，全天 24 小时共 288 个刻度
const STEP_MINUTES = 5
const TOTAL_TICKS = (24 * 60) / STEP_MINUTES // 288
const TICK_WIDTH = 14 // 每个刻度占据 14px 宽度，滑动阻尼细腻
const CURVE_RADIUS = 110 // 「中间高两边低」凸透镜波峰半径 (px)

const DURATION_OPTIONS = [15, 30, 45, 60, 90]

// 时间与序号双向转换
const getTimeFromIndex = (index: number): string => {
  const totalMinutes = index * STEP_MINUTES
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const getIndexFromTime = (timeStr: string): number => {
  if (!timeStr) return 0
  const [hStr, mStr] = timeStr.split(':')
  const h = parseInt(hStr, 10) || 0
  const m = parseInt(mStr, 10) || 0
  const totalMinutes = h * 60 + m
  return Math.round(totalMinutes / STEP_MINUTES)
}

// 获取最接近当前时间的 5 分钟刻度
export const getNearestCurrentTime = (): string => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const rounded = Math.round(minutes / 5) * 5
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

// 获取时段标签 (凌晨 / 上午 / 下午 / 晚间)
const getPeriodLabel = (timeStr: string): string => {
  const h = parseInt(timeStr.split(':')[0], 10) || 0
  if (h < 6) return '凌晨'
  if (h < 12) return '上午'
  if (h < 14) return '中午'
  if (h < 18) return '下午'
  return '晚间'
}

// 计算每个刻度距离中央的凸透镜高度系数 (0.0 ~ 1.0)
const getCurveFactor = (tickIndex: number, currentScrollLeft: number): number => {
  const tickX = tickIndex * TICK_WIDTH
  const dist = Math.abs(tickX - currentScrollLeft)
  if (dist >= CURVE_RADIUS) return 0
  // 余弦平滑钟形曲线: cos(dist / RADIUS * π/2)，顶点平滑，两端自然收拢
  const normalized = dist / CURVE_RADIUS
  return Math.cos(normalized * (Math.PI / 2))
}

export const TimelineRibbon: React.FC<TimelineRibbonProps> = ({
  time,
  duration,
  onChangeTime,
  onChangeDuration
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScrollRef = useRef(false)
  const isMouseDownRef = useRef(false)
  const startXRef = useRef(0)
  const startScrollLeftRef = useRef(0)

  // 记录当前实时滚动位置，用于渲染「中间高两边低」的物理波峰特效
  const [scrollLeft, setScrollLeft] = useState(() => getIndexFromTime(time) * TICK_WIDTH)

  const endTime = calculateEndTime(time, duration)

  // 滚动并居中指定时间槽
  const scrollToTime = useCallback((targetTime: string, smooth = true) => {
    if (!scrollContainerRef.current) return
    const index = getIndexFromTime(targetTime)
    const targetScrollLeft = index * TICK_WIDTH
    scrollContainerRef.current.scrollTo({
      left: targetScrollLeft,
      behavior: smooth ? 'smooth' : 'auto'
    })
    setScrollLeft(targetScrollLeft)
  }, [])

  // 页面加载或切换编辑任务时，初始居中到初始时间
  useEffect(() => {
    isProgrammaticScrollRef.current = true
    scrollToTime(time, false)
    const rAF = requestAnimationFrame(() => {
      scrollToTime(time, false)
    })
    const timer = setTimeout(() => {
      scrollToTime(time, false)
      isProgrammaticScrollRef.current = false
    }, 220)
    return () => {
      cancelAnimationFrame(rAF)
      clearTimeout(timer)
    }
  }, [])

  // 核心交互：滑动中直接选择！波峰中心对准的刻度即为当前选中时间，毫秒级响应
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollLeft = e.currentTarget.scrollLeft
    setScrollLeft(currentScrollLeft)

    if (isProgrammaticScrollRef.current) return
    const index = Math.round(currentScrollLeft / TICK_WIDTH)
    const clampedIndex = Math.max(0, Math.min(index, TOTAL_TICKS - 1))
    const newTime = getTimeFromIndex(clampedIndex)
    if (newTime !== time) {
      onChangeTime(newTime)
    }
  }

  // 桌面端鼠标拖拽支持
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true
    startXRef.current = e.clientX
    startScrollLeftRef.current = scrollContainerRef.current?.scrollLeft || 0

    const onMouseMove = (ev: MouseEvent) => {
      if (!isMouseDownRef.current || !scrollContainerRef.current) return
      const dx = ev.clientX - startXRef.current
      scrollContainerRef.current.scrollLeft = startScrollLeftRef.current - dx
    }

    const onMouseUp = () => {
      isMouseDownRef.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // 鼠标滚轮水平横滑
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current && e.deltaY !== 0) {
      scrollContainerRef.current.scrollLeft += e.deltaY
    }
  }

  // 快速定位「现在」
  const handleJumpToNow = () => {
    const nowTime = getNearestCurrentTime()
    onChangeTime(nowTime)
    isProgrammaticScrollRef.current = true
    scrollToTime(nowTime, true)
    setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 350)
  }

  // 点击某个具体刻度直接居中选中
  const handleTickClick = (targetTime: string) => {
    onChangeTime(targetTime)
    isProgrammaticScrollRef.current = true
    scrollToTime(targetTime, true)
    setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 300)
  }

  return (
    <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-3.5 select-none">
      {/* 顶部轻量栏 */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-400 tracking-wider">
          时序标尺
        </span>
        <button
          type="button"
          onClick={handleJumpToNow}
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-white border border-zinc-200/80 hover:bg-zinc-100 text-zinc-700 rounded-lg shadow-2xs transition-colors cursor-pointer active:scale-95"
          title="跳转至当前时间"
        >
          <Zap size={11} className="text-zinc-800 fill-zinc-800" />
          <span>现在</span>
        </button>
      </div>

      {/* 刻度滑尺区域：中间高两边低波峰效果，无遮挡黑线 */}
      <div className="relative py-1">
        {/* 左边缘淡出渐变遮罩 */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-zinc-50 to-transparent pointer-events-none z-10" />

        {/* 右边缘淡出渐变遮罩 */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-50 to-transparent pointer-events-none z-10" />

        {/* 纯粹横向时间刻度线（中间高两边低 · 凸透镜波峰曲线） */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          className="flex items-end overflow-x-auto no-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing h-14"
          style={{
            paddingLeft: 'calc(50% - 7px)',
            paddingRight: 'calc(50% - 7px)'
          }}
        >
          {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
            const slotTime = getTimeFromIndex(i)
            const isHour = i % 12 === 0
            const isHalf = i % 6 === 0 && !isHour
            const factor = getCurveFactor(i, scrollLeft)
            const isPeak = factor > 0.95

            // 核心规范：中间必须是绝对最高最粗；整点仅比普通刻度稍粗一点点
            const PEAK_HEIGHT = 32 // 正中央波峰最高高度 (32px)
            const PEAK_WIDTH = isHour ? 3.0 : 2.7 // 正中央波峰最粗宽度

            // 两侧边缘基础高度 (整点 9px, 半点 7px, 普通 5px)
            const baseHeight = isHour ? 9 : isHalf ? 7 : 5
            // 两侧边缘基础宽度 (整点 1.6px 比普通 1.2px 略粗一点)
            const baseWidth = isHour ? 1.6 : 1.2

            // 高度与粗细受中央距离 factor 全面主导（中间必然最高最粗）
            const height = Math.round(baseHeight + (PEAK_HEIGHT - baseHeight) * Math.pow(factor, 1.1))
            const width = +(baseWidth + (PEAK_WIDTH - baseWidth) * factor).toFixed(1)

            // 颜色：正中纯黑，两侧递减为浅灰
            const bgClass = factor > 0.85
              ? 'bg-zinc-950'
              : factor > 0.5
                ? 'bg-zinc-700'
                : isHour
                  ? 'bg-zinc-400'
                  : 'bg-zinc-300'

            return (
              <div
                key={i}
                onClick={() => handleTickClick(slotTime)}
                className="shrink-0 snap-center flex flex-col items-center justify-end h-full cursor-pointer group"
                style={{ width: `${TICK_WIDTH}px` }}
              >
                {/* 整点小时微标标注 (例如 09, 10, 11) */}
                {isHour && (
                  <span
                    className="text-[9.5px] font-mono mb-1.5 pointer-events-none transition-all duration-75"
                    style={{
                      opacity: Math.max(0.3, factor),
                      fontWeight: factor > 0.5 ? 700 : 500,
                      color: factor > 0.5 ? '#09090b' : '#a1a1aa'
                    }}
                  >
                    {slotTime.split(':')[0]}
                  </span>
                )}

                {/* 刻度本尊：中间绝对最高最粗 (32px / 2.7~3px)，两侧平滑收拢 */}
                <span
                  className={cn(
                    'transition-all duration-75 rounded-full shrink-0',
                    bgClass,
                    isPeak && 'shadow-xs'
                  )}
                  style={{
                    height: `${height}px`,
                    width: `${width}px`
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* 刻度线下方：时间大字数值与起止联动显示 */}
      <div className="flex flex-col items-center justify-center pt-1 select-none">
        <div className="flex items-baseline gap-2">
          {/* 大号当前选中时间 */}
          <span className="text-3xl font-mono font-bold tracking-tight text-zinc-950">
            {time}
          </span>
          {/* 联动结束时刻 */}
          <span className="text-xs font-mono font-semibold text-zinc-400">
            ➔ {endTime}
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 font-normal mt-0.5">
          {getPeriodLabel(time)} · 持续 {duration} 分钟
        </span>
      </div>

      {/* 底部：持续时长胶囊选择 */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50">
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
