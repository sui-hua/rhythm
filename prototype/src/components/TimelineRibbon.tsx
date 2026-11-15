import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '../lib/utils'

interface TimelineRibbonProps {
  time: string // 'HH:mm'
  duration: number // 分钟数
  onChangeTime: (time: string) => void
  onChangeDuration: (duration: number) => void
}

// ─────────────────────────────────────────────────────────────
// 🎛️ 标尺比例与视觉微调参数配置中心（在这里改数值，保存立即生效！）
// ─────────────────────────────────────────────────────────────
const SCALE_CONFIG = {
  // 1. 红针总高度（从底部基线向上算，单位 px）
  needleHeight: 44,

  // 2. 各级刻度高度（从底部基线向上算，单位 px）
  hourHeight: 28,        // 整点黑色大刻度
  halfHourHeight: 24,    // 30分钟半点刻度
  quarterHourHeight: 18, // 15 / 45 分钟一刻刻度
  minorHeight: 14,       // 5分钟小刻度

  // 3. 刻度线粗细
  hourWidth: '1.5px',
  halfHourWidth: '1.2px',
  minorWidth: '1.0px',

  // 4. 刻度间距（每个 5 分钟占的水平像素宽度）
  tickWidth: 14,

  // 5. 标尺滚动画布总高度（单位 px）
  trackHeight: 54,
}

// 刻度步长：5 分钟一个刻度，全天 24 小时共 288 个刻度
const STEP_MINUTES = 5
const TOTAL_TICKS = (24 * 60) / STEP_MINUTES // 288
const TICK_WIDTH = SCALE_CONFIG.tickWidth // 每个刻度占据的像素宽度

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

// 计算结束时间 (保留兼容性)
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMouseDownRef = useRef(false)
  const startXRef = useRef(0)
  const startScrollLeftRef = useRef(0)

  // 记录当前实时滚动位置
  const [scrollLeft, setScrollLeft] = useState(() => getIndexFromTime(time) * TICK_WIDTH)

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

  // 初始加载时居中当前时间
  useEffect(() => {
    scrollToTime(time, false)
    const rAF = requestAnimationFrame(() => {
      scrollToTime(time, false)
    })
    return () => cancelAnimationFrame(rAF)
  }, [])

  // 核心交互：滑动中 0 延迟实时跟随选择
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollLeft = e.currentTarget.scrollLeft
    setScrollLeft(currentScrollLeft)

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

  // 点击某一刻度直接对齐居中
  const handleTickClick = (targetTime: string) => {
    onChangeTime(targetTime)
    scrollToTime(targetTime, true)
  }

  // 联动结束时刻
  const endTime = calculateEndTime(time, duration)

  // 手动输入时长状态（单位：分钟）
  const [prevDuration, setPrevDuration] = useState(duration)
  const [inputValue, setInputValue] = useState(String(duration))

  // 当外部 duration 属性改变时，同步更新输入框状态（React 官方推荐的无 Effect 同步范式）
  if (prevDuration !== duration) {
    setPrevDuration(duration)
    setInputValue(String(duration))
  }

  // 手动输入变化处理
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(raw)
    const val = parseInt(raw, 10)
    if (!isNaN(val) && val > 0) {
      const clamped = Math.min(720, val)
      onChangeDuration(clamped)
    }
  }

  // 输入框失焦校验
  const handleDurationBlur = () => {
    const val = parseInt(inputValue, 10)
    if (isNaN(val) || val <= 0) {
      setInputValue('30')
      onChangeDuration(30)
    } else {
      const clamped = Math.min(720, Math.max(5, val))
      setInputValue(String(clamped))
      onChangeDuration(clamped)
    }
  }

  // 回车确认输入
  const handleDurationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  // 时长微调（15分以内每次步进5分，15分以上每次步进15分）
  const handleDecreaseDuration = () => {
    let next: number
    if (duration <= 15) {
      next = Math.max(5, duration - 5)
    } else if (duration % 15 !== 0) {
      next = Math.floor((duration - 1) / 15) * 15
    } else {
      next = Math.max(15, duration - 15)
    }
    onChangeDuration(next)
    setInputValue(String(next))
  }

  const handleIncreaseDuration = () => {
    let next: number
    if (duration < 15) {
      next = duration + 5
    } else if (duration % 15 !== 0) {
      next = Math.ceil((duration + 1) / 15) * 15
    } else {
      next = Math.min(720, duration + 15)
    }
    onChangeDuration(next)
    setInputValue(String(next))
  }

  return (
    <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-4 select-none">
      {/* 刻度滑尺区域：Rauno 同款极简精密游标尺 (Precision Vernier Scale) */}
      <div className="relative py-1 overflow-hidden">
        {/* 灵魂核心：正中央固定发丝级亮橙红游标指针 + 微型倒三角 (Vernier Needle) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 z-20 pointer-events-none flex flex-col items-center"
          style={{ height: `${SCALE_CONFIG.needleHeight}px` }}
        >
          {/* 精致微型倒三角指示器 (▼) */}
          <svg
            className="w-2.5 h-2 text-[#ff3b00] fill-current drop-shadow-[0_1px_2px_rgba(255,59,0,0.3)] shrink-0"
            viewBox="0 0 10 7"
          >
            <path d="M0 0 L10 0 L5 7 Z" />
          </svg>
          {/* 发丝级垂直游标指针线 */}
          <div className="w-[1.5px] flex-1 bg-[#ff3b00] shadow-[0_0_6px_rgba(255,59,0,0.45)] rounded-full" />
        </div>

        {/* 横向滚动发丝级精密刻度带 */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          className="flex items-end overflow-x-auto no-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
          style={{
            height: `${SCALE_CONFIG.trackHeight}px`,
            paddingLeft: 'calc(50% - 7px)',
            paddingRight: 'calc(50% - 7px)'
          }}
        >
          {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
            const slotTime = getTimeFromIndex(i)
            const isHour = i % 12 === 0
            const isHalfHour = i % 6 === 0 && !isHour
            const isQuarterHour = i % 3 === 0 && !isHour && !isHalfHour

            const tickX = i * TICK_WIDTH
            const dist = Math.abs(tickX - scrollLeft)
            const isNearCenter = dist < 24

            // 从顶部 SCALE_CONFIG 动态读取四级高度与粗细：
            const tickHeight = isHour
              ? SCALE_CONFIG.hourHeight
              : isHalfHour
                ? SCALE_CONFIG.halfHourHeight
                : isQuarterHour
                  ? SCALE_CONFIG.quarterHourHeight
                  : SCALE_CONFIG.minorHeight

            const tickWidth = isHour
              ? SCALE_CONFIG.hourWidth
              : isHalfHour
                ? SCALE_CONFIG.halfHourWidth
                : SCALE_CONFIG.minorWidth
            // 颜色统一为黑色，纯粹通过四级高度梯度区分层级
            const tickColor = 'bg-zinc-900'

            return (
              <div
                key={i}
                onClick={() => handleTickClick(slotTime)}
                className="shrink-0 snap-center flex flex-col items-center justify-end h-full cursor-pointer group"
                style={{ width: `${TICK_WIDTH}px` }}
              >
                {/* 整点小时微标标注 (例如 09, 10, 11) */}
                {isHour ? (
                  <span
                    className={cn(
                      'text-[9px] font-mono mb-1.5 pointer-events-none select-none transition-colors duration-150',
                      isNearCenter ? 'text-zinc-950 font-bold' : 'text-zinc-700 font-medium'
                    )}
                  >
                    {slotTime.split(':')[0]}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono mb-1.5 invisible select-none">
                    00
                  </span>
                )}

                {/* 极简发丝级刻度线本尊 */}
                <div
                  className={cn(
                    'rounded-full shrink-0 transition-colors duration-100',
                    tickColor
                  )}
                  style={{
                    height: `${tickHeight}px`,
                    width: tickWidth
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* 联动起止中轴线：纯净极简单行 [ 开始时间 ] ── [ 时长胶囊 ] ── [ 结束时间 ] */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1 select-none">
        {/* 左侧：开始时刻 */}
        <span className="text-[22px] font-mono font-bold tracking-tight text-zinc-950 tabular-nums shrink-0">
          {time}
        </span>

        {/* 中间：时长微调与手动输入胶囊（单位：分钟） */}
        <div className="flex items-center bg-white border border-zinc-200/90 rounded-full px-2 py-1 shadow-2xs shrink-0 focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all">
          <button
            type="button"
            onClick={handleDecreaseDuration}
            disabled={duration <= 5}
            className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-all cursor-pointer shrink-0"
            title="减少时长"
          >
            <Minus size={11} strokeWidth={2.5} />
          </button>
          <div className="flex items-center justify-center px-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={handleDurationChange}
              onBlur={handleDurationBlur}
              onKeyDown={handleDurationKeyDown}
              onFocus={(e) => e.target.select()}
              style={{
                width: `${Math.max(2, inputValue.length) * 8.5 + 4}px`
              }}
              className="text-center text-xs font-mono font-bold text-zinc-900 bg-transparent focus:outline-none select-all cursor-text"
              title="点击手动输入时长（单位：分钟）"
            />
            <span className="text-[11px] font-medium text-zinc-400 select-none pointer-events-none pr-0.5">
              分钟
            </span>
          </div>
          <button
            type="button"
            onClick={handleIncreaseDuration}
            disabled={duration >= 720}
            className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-all cursor-pointer shrink-0"
            title="增加时长"
          >
            <Plus size={11} strokeWidth={2.5} />
          </button>
        </div>

        {/* 右侧：结束时刻 */}
        <span className="text-[22px] font-mono font-bold tracking-tight text-zinc-950 tabular-nums shrink-0">
          {endTime}
        </span>
      </div>
    </div>
  )
}
