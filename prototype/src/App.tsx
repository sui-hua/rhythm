import { useMemo, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { AppHeader } from './components/AppHeader'
import { TabBar } from './components/TabBar'
import { DayView } from './components/DayView'
import { HabitsView } from './components/HabitsView'
import { DirectionView } from './components/DirectionView'
import { SummaryView } from './components/SummaryView'
import { DatePickerDrawer } from './components/DatePickerDrawer'
import { HabitDetailModal } from './components/HabitDetailModal'
import { TaskModal } from './components/Modals/TaskModal'
import { HabitModal } from './components/Modals/HabitModal'
import { SummaryModal } from './components/Modals/SummaryModal'
import {
  NAV_ITEMS,
  INITIAL_HABITS,
  INITIAL_GOALS,
  INITIAL_SUMMARIES,
  getInitialTasksByDate
} from './data/mockData'
import type { Habit, PeriodType, TabKey, Task } from './types'
import { cn } from './lib/utils'

export function App() {
  // ── 全局状态 ──
  const [currentTab, setCurrentTab] = useState<TabKey>('day')
  const [showFrame, setShowFrame] = useState(true)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev))
    }, 1800)
  }

  // ── 1. 时序 (Day) 状态 ──
  const [dayOffset, setDayOffset] = useState(0)
  const isToday = dayOffset === 0

  const currentDateObj = useMemo(() => {
    const d = new Date(2026, 4, 11) // 2026年5月11日基准
    d.setDate(d.getDate() + dayOffset)
    return d
  }, [dayOffset])

  const selectedDateLine = useMemo(() => {
    return `${currentDateObj.getFullYear()}年${currentDateObj.getMonth() + 1}月${currentDateObj.getDate()}日`
  }, [currentDateObj])

  const currentDateKey = useMemo(() => {
    const y = currentDateObj.getFullYear()
    const m = String(currentDateObj.getMonth() + 1).padStart(2, '0')
    const date = String(currentDateObj.getDate()).padStart(2, '0')
    return `${y}-${m}-${date}`
  }, [currentDateObj])

  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>(getInitialTasksByDate())

  const currentTasks = useMemo(() => {
    return tasksByDate[currentDateKey] || []
  }, [tasksByDate, currentDateKey])

  const completedTasksCount = useMemo(() => {
    return currentTasks.filter((t) => t.completed).length
  }, [currentTasks])

  const taskRingOffset = useMemo(() => {
    if (!currentTasks.length) return 88
    const progress = completedTasksCount / currentTasks.length
    return 88 * (1 - progress)
  }, [completedTasksCount, currentTasks])

  const handleToggleTask = (task: Task) => {
    setTasksByDate((prev) => {
      const list = prev[currentDateKey] || []
      const nextList = list.map((item) =>
        item.id === task.id ? { ...item, completed: !item.completed } : item
      )
      return { ...prev, [currentDateKey]: nextList }
    })
    showToast(task.completed ? '已恢复' : '已完成')
  }

  // 日期抽屉
  const [showDatePicker, setShowDatePicker] = useState(false)
  const handleSelectDate = (target: Date) => {
    const base = new Date(2026, 4, 11)
    const diffDays = Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
    setDayOffset(diffDays)
    showToast(`已切换至 ${target.getFullYear()}年${target.getMonth() + 1}月${target.getDate()}日`)
  }

  // 任务弹窗
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const handleOpenAddTask = () => {
    setEditingTask(null)
    setShowTaskModal(true)
  }

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  const handleSaveTask = (data: { id: number | null; title: string; time: string; duration: number }) => {
    setTasksByDate((prev) => {
      const list = prev[currentDateKey] || []
      if (data.id) {
        const nextList = list.map((item) =>
          item.id === data.id
            ? { ...item, title: data.title, time: data.time, duration: data.duration }
            : item
        )
        return { ...prev, [currentDateKey]: nextList }
      } else {
        const newTask: Task = {
          id: Date.now(),
          title: data.title,
          time: data.time || '09:00',
          duration: data.duration || 30,
          completed: false
        }
        return { ...prev, [currentDateKey]: [...list, newTask] }
      }
    })
    showToast('已保存')
  }

  const handleDeleteTask = (taskId: number) => {
    setTasksByDate((prev) => {
      const list = prev[currentDateKey] || []
      return { ...prev, [currentDateKey]: list.filter((item) => item.id !== taskId) }
    })
    showToast('已删除')
  }

  // ── 2. 习惯 (Habits) 状态 ──
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS)
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null)
  const [showHabitModal, setShowHabitModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const selectedHabit = useMemo(() => {
    return habits.find((h) => h.id === selectedHabitId) || null
  }, [habits, selectedHabitId])

  const completedHabitsCount = useMemo(() => {
    return habits.filter((h) => h.completedToday).length
  }, [habits])

  // 今日一秒打卡 / 撤销
  const handleToggleHabit = (habit: Habit) => {
    const todayStr = '2026-05-11'
    const willBeCompleted = !habit.completedToday

    setHabits((prev) =>
      prev.map((item) => {
        if (item.id !== habit.id) return item

        let nextDays = [...item.completedDays]
        let nextLogs = [...item.logs]

        if (willBeCompleted) {
          if (!nextDays.includes(todayStr)) nextDays.push(todayStr)
          nextLogs.unshift({
            id: Date.now(),
            date: todayStr,
            time: '09:41'
          })
        } else {
          nextDays = nextDays.filter((d) => d !== todayStr)
          nextLogs = nextLogs.filter((l) => l.date !== todayStr)
        }

        const streakDelta = willBeCompleted ? 1 : -1
        const totalDelta = willBeCompleted ? 1 : -1

        return {
          ...item,
          completedToday: willBeCompleted,
          completedDays: nextDays,
          streak: Math.max(0, item.streak + streakDelta),
          totalYear: Math.max(0, item.totalYear + totalDelta),
          logs: nextLogs
        }
      })
    )

    showToast(willBeCompleted ? '已打卡' : '已撤销')
  }

  // 新增或保存习惯
  const handleSaveHabit = (data: { id?: number; title: string; frequency: string }) => {
    if (data.id) {
      setHabits((prev) =>
        prev.map((item) =>
          item.id === data.id ? { ...item, title: data.title, frequency: data.frequency } : item
        )
      )
      showToast('习惯已更新')
    } else {
      const newHabit: Habit = {
        id: Date.now(),
        title: data.title,
        streak: 0,
        frequency: data.frequency,
        completedToday: false,
        completedDays: [],
        totalYear: 0,
        completionRate: 0,
        logs: []
      }
      setHabits((prev) => [...prev, newHabit])
      showToast('习惯已添加')
    }
    setShowHabitModal(false)
  }

  const handleDeleteHabit = (id: number) => {
    setHabits((prev) => prev.filter((item) => item.id !== id))
    if (selectedHabitId === id) setSelectedHabitId(null)
    setShowHabitModal(false)
    showToast('习惯已删除')
  }

  // ── 3. 所向 (Direction) 状态 ──
  const [goals] = useState(INITIAL_GOALS)
  const handleClickGoal = (goal: (typeof goals)[0]) => {
    showToast(`目标进度：${goal.progress}%`)
  }

  // ── 4. 总结 (Summary) 状态 ──
  const [activePeriod, setActivePeriod] = useState<PeriodType>('日')
  const [summaries, setSummaries] = useState(INITIAL_SUMMARIES)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  const currentSummaries = useMemo(() => {
    return summaries.filter((s) => s.period === activePeriod)
  }, [summaries, activePeriod])

  const handleSaveSummary = (data: { text: string; period: PeriodType }) => {
    setSummaries((prev) => [
      {
        id: Date.now(),
        period: data.period,
        date: '5月11日 今天',
        text: data.text
      },
      ...prev
    ])
    showToast('已记录')
  }

  // ── FAB 点击响应 ──
  const handleFabClick = () => {
    if (currentTab === 'day') handleOpenAddTask()
    else if (currentTab === 'habits') {
      setEditingHabit(null)
      setShowHabitModal(true)
    } else if (currentTab === 'direction') showToast('所向目标请长按或点击查看')
    else if (currentTab === 'summary') setShowSummaryModal(true)
  }

  // ── 重置数据 ──
  const handleResetSampleData = () => {
    setDayOffset(0)
    setTasksByDate(getInitialTasksByDate())
    setHabits(INITIAL_HABITS)
    setSummaries(INITIAL_SUMMARIES)
    setActivePeriod('日')
    setSelectedHabitId(null)
    showToast('数据已重置')
  }

  // ── 顶栏配置渲染 ──
  const renderHeaderTitleSlot = () => {
    if (currentTab === 'day') {
      return (
        <button
          type="button"
          onClick={() => setShowDatePicker(true)}
          className="group flex items-center gap-1.5 text-left text-zinc-900 active:scale-[0.98] transition-all select-none"
          title="点击选择日期"
        >
          <h1 className="text-[22px] font-bold tracking-tight font-sans group-hover:text-zinc-600 transition-colors">
            {selectedDateLine}
          </h1>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-zinc-800 group-hover:bg-zinc-100 transition-all">
            <ChevronDown size={13} strokeWidth={2.5} />
          </div>
          {!isToday && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                setDayOffset(0)
                showToast('已回到今天')
              }}
              className="text-[10px] font-mono font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded-full transition-colors active:scale-95 ml-0.5 cursor-pointer"
              title="点击直接返回今天"
            >
              今
            </span>
          )}
        </button>
      )
    }
    return undefined
  }

  const renderHeaderRightSlot = () => {
    if (currentTab === 'day') {
      return (
        <div
          className="relative w-7 h-7 flex items-center justify-center shrink-0 cursor-default"
          title={`今日进度：${completedTasksCount}/${currentTasks.length}`}
        >
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" stroke="#e4e4e7" strokeWidth="2.8" fill="none" />
            <circle
              cx="18"
              cy="18"
              r="14"
              stroke="#18181b"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="88"
              strokeDashoffset={taskRingOffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
        </div>
      )
    }
    if (currentTab === 'habits') {
      return (
        <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
          已打卡 {completedHabitsCount} / {habits.length}
        </span>
      )
    }
    if (currentTab === 'direction') {
      return (
        <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
          {goals.length} 个里程碑
        </span>
      )
    }
    if (currentTab === 'summary') {
      return (
        <div className="flex bg-zinc-100 p-0.5 rounded-full text-xs font-semibold">
          {(['日', '周', '月', '年'] as PeriodType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActivePeriod(t)}
              className={cn(
                'px-2.5 py-0.5 transition-all',
                activePeriod === t
                  ? 'bg-white text-zinc-900 shadow-xs rounded-full font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )
    }
    return null
  }

  const getHeaderProps = () => {
    switch (currentTab) {
      case 'habits':
        // 彻底砍掉冗余口号“微小动作 · 积聚复利”，只留纯正大标题
        return { title: '日常习惯', subtitle: '' }
      case 'direction':
        return { title: '长期目标', subtitle: '保持方向感 · 步步为营' }
      case 'summary':
        return { title: '复盘总结', subtitle: '' }
      default:
        return { title: '', subtitle: '' }
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      {/* 外部桌面辅助工具条 */}
      <header className="hidden md:flex items-center justify-between w-full max-w-[390px] mb-3 px-3 text-zinc-400 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
          <span className="font-medium text-zinc-800 tracking-tight">Rhythm Mobile</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetSampleData}
            className="hover:text-zinc-900 transition-colors font-medium cursor-pointer"
          >
            重置数据
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShowFrame((prev) => !prev)}
            className="hover:text-zinc-900 transition-colors font-medium cursor-pointer"
          >
            {showFrame ? '全屏查看' : '机壳查看'}
          </button>
        </div>
      </header>

      {/* 手机视口容器：高级微灰画布 (#f4f4f7) */}
      <main
        className={cn(
          'w-full max-w-[390px] h-[100dvh] md:h-[844px] bg-[#f4f4f7] relative flex flex-col overflow-hidden transition-all duration-300',
          showFrame
            ? 'md:rounded-[48px] md:shadow-[0_25px_65px_-12px_rgba(0,0,0,0.18)] md:border-[10px] md:border-zinc-900 ring-1 ring-zinc-800/20'
            : 'md:rounded-none'
        )}
      >
        {/* 吸顶导航栏 */}
        <AppHeader
          time="09:41"
          {...getHeaderProps()}
          titleSlot={renderHeaderTitleSlot()}
          rightSlot={renderHeaderRightSlot()}
        />

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto no-scrollbar ios-scroll relative pb-32">
          {currentTab === 'day' && (
            <DayView
              tasks={currentTasks}
              onToggleTask={handleToggleTask}
              onEditTask={handleOpenEditTask}
              onAddTask={handleOpenAddTask}
            />
          )}

          {currentTab === 'habits' && (
            <HabitsView
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onClickHabit={(habit) => setSelectedHabitId(habit.id)}
            />
          )}

          {currentTab === 'direction' && (
            <DirectionView goals={goals} onClickGoal={handleClickGoal} />
          )}

          {currentTab === 'summary' && (
            <SummaryView
              summaries={currentSummaries}
              onClickSummary={() => showToast('点击查看复盘详情')}
            />
          )}
        </div>

        {/* 弥散柔光悬浮操作按钮 (FAB) */}
        <button
          type="button"
          onClick={handleFabClick}
          className="absolute bottom-[78px] right-6 w-12 h-12 rounded-full bg-zinc-900 text-white shadow-fab hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-40 cursor-pointer"
          title="新建"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>

        {/* 底部原生毛玻璃 TabBar */}
        <TabBar currentTab={currentTab} items={NAV_ITEMS} onChangeTab={setCurrentTab} />

        {/* 日历选择抽屉 */}
        {showDatePicker && (
          <DatePickerDrawer
            currentDateObj={currentDateObj}
            tasksByDate={tasksByDate}
            isToday={isToday}
            onClose={() => setShowDatePicker(false)}
            onSelectDate={handleSelectDate}
            onSelectToday={() => {
              setDayOffset(0)
              showToast('已回到今天')
            }}
          />
        )}

        {/* 习惯详情与月历打卡弹窗（居中浮层 · 纯看打卡足迹） */}
        {selectedHabit && (
          <HabitDetailModal
            habit={selectedHabit}
            onClose={() => setSelectedHabitId(null)}
            onEdit={(h) => {
              setEditingHabit(h)
              setShowHabitModal(true)
            }}
          />
        )}

        {/* 任务新增/编辑弹窗 */}
        {showTaskModal && (
          <TaskModal
            task={editingTask}
            onClose={() => setShowTaskModal(false)}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
          />
        )}

        {/* 习惯新增/编辑弹窗 */}
        {showHabitModal && (
          <HabitModal
            habit={editingHabit}
            onClose={() => {
              setShowHabitModal(false)
              setEditingHabit(null)
            }}
            onSave={handleSaveHabit}
            onDelete={handleDeleteHabit}
          />
        )}

        {/* 复盘新增弹窗 */}
        {showSummaryModal && (
          <SummaryModal
            period={activePeriod}
            onClose={() => setShowSummaryModal(false)}
            onSave={handleSaveSummary}
          />
        )}

        {/* 轻量优雅 Toast 提示 */}
        {toastMessage && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 backdrop-blur-md text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none transition-all animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {toastMessage}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
