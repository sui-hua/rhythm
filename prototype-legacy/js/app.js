// ========================================================
// Rhythm 移动端原型 - 主入口与状态管理编排
// ========================================================

(function () {
  const { createApp, ref, computed } = Vue;

  const app = createApp({
    setup() {
      // ── 全局与框架状态 ──
      const currentTab = ref('day');
      const showFrame = ref(true);
      const toastMessage = ref('');
      const currentHourTime = ref('09:41');

      const togglePhoneFrame = () => {
        showFrame.value = !showFrame.value;
      };

      const showToast = (msg) => {
        toastMessage.value = msg;
        setTimeout(() => {
          if (toastMessage.value === msg) toastMessage.value = '';
        }, 1800);
      };

      const navItems = window.MOCK_DATA.navItems;

      // ── 统一导航栏动态配置 ──
      const currentHeaderConfig = computed(() => {
        switch (currentTab.value) {
          case 'habits':
            return { title: '日常习惯', subtitle: '微小动作 · 积聚复利' };
          case 'direction':
            return { title: '长期目标', subtitle: '保持方向感 · 步步为营' };
          case 'summary':
            return { title: '复盘总结', subtitle: '' };
          default:
            return { title: '', subtitle: '' };
        }
      });

      // ── 1. 时序 (Day) 状态与方法 ──
      const dayOffset = ref(0);
      const isToday = computed(() => dayOffset.value === 0);

      const currentDateObj = computed(() => {
        const d = new Date(2026, 4, 11); // 2026年5月11日基准
        d.setDate(d.getDate() + dayOffset.value);
        return d;
      });

      const selectedDateLine = computed(() => {
        const d = currentDateObj.value;
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
      });

      const currentDateKey = computed(() => {
        const d = currentDateObj.value;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${date}`;
      });

      const tasksByDate = ref(window.MOCK_DATA.getInitialTasksByDate());

      const currentTasks = computed(() => {
        if (!tasksByDate.value[currentDateKey.value]) {
          tasksByDate.value[currentDateKey.value] = [];
        }
        return tasksByDate.value[currentDateKey.value];
      });

      const completedTasksCount = computed(() => currentTasks.value.filter(t => t.completed).length);

      const taskRingOffset = computed(() => {
        if (!currentTasks.value.length) return 88;
        const progress = completedTasksCount.value / currentTasks.value.length;
        return 88 * (1 - progress);
      });

      const onToggleTask = (task) => {
        task.completed = !task.completed;
        showToast(task.completed ? '已完成' : '已恢复');
      };

      // 日期选择抽屉
      const showDatePicker = ref(false);
      const openDatePicker = () => { showDatePicker.value = true; };

      const onSelectCalendarDate = (dateObj) => {
        const base = new Date(2026, 4, 11);
        dayOffset.value = Math.round((dateObj.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
        showToast('已切换至 ' + selectedDateLine.value);
      };

      const onSelectToday = () => {
        dayOffset.value = 0;
        showToast('已回到今天');
      };

      // 任务模态弹窗 (新增/编辑)
      const showTaskModal = ref(false);
      const editingTask = ref(null);

      const onAddTask = () => {
        editingTask.value = null;
        showTaskModal.value = true;
      };

      const onEditTask = (task) => {
        editingTask.value = task;
        showTaskModal.value = true;
      };

      const onSaveTask = (taskData) => {
        if (taskData.id) {
          const t = currentTasks.value.find(item => item.id === taskData.id);
          if (t) {
            t.title = taskData.title;
            t.time = taskData.time;
            t.duration = taskData.duration;
          }
        } else {
          currentTasks.value.push({
            id: Date.now(),
            title: taskData.title,
            time: taskData.time,
            duration: taskData.duration,
            completed: false
          });
        }
        showToast('已保存');
      };

      const onDeleteTask = (taskId) => {
        const idx = currentTasks.value.findIndex(t => t.id === taskId);
        if (idx !== -1) {
          currentTasks.value.splice(idx, 1);
        }
        showToast('已删除');
      };

      // ── 2. 习惯 (Habits) ──
      const habits = ref(JSON.parse(JSON.stringify(window.MOCK_DATA.initialHabits)));
      const completedHabitsCount = computed(() => habits.value.filter(h => h.completedToday).length);
      const showHabitModal = ref(false);

      const onToggleHabit = (habit) => {
        habit.completedToday = !habit.completedToday;
        showToast(habit.completedToday ? '已打卡' : '已撤销');
      };

      const onSaveHabit = (data) => {
        habits.value.push({
          id: Date.now(),
          title: data.title,
          streak: 1,
          frequency: data.frequency,
          completedToday: false
        });
        showToast('习惯已添加');
      };

      // ── 3. 所向 (Direction) ──
      const goals = ref(JSON.parse(JSON.stringify(window.MOCK_DATA.initialGoals)));
      const onClickGoal = (goal) => {
        showToast(`目标进度：${goal.progress}%`);
      };

      // ── 4. 总结 (Summary) ──
      const activePeriod = ref('日');
      const summaries = ref(JSON.parse(JSON.stringify(window.MOCK_DATA.initialSummaries)));
      const currentSummaries = computed(() => summaries.value.filter(s => s.period === activePeriod.value));
      const showSummaryModal = ref(false);

      const onSaveSummary = (data) => {
        summaries.value.unshift({
          id: Date.now(),
          period: data.period,
          date: '5月11日 今天',
          text: data.text
        });
        showToast('已记录');
      };

      // ── FAB 悬浮操作按钮 ──
      const handleFabClick = () => {
        if (currentTab.value === 'day') onAddTask();
        else if (currentTab.value === 'habits') showHabitModal.value = true;
        else if (currentTab.value === 'direction') showToast('所向目标请长按或点击查看');
        else if (currentTab.value === 'summary') showSummaryModal.value = true;
      };

      // ── 重置数据 ──
      const resetSampleData = () => {
        dayOffset.value = 0;
        tasksByDate.value = window.MOCK_DATA.getInitialTasksByDate();
        habits.value = JSON.parse(JSON.stringify(window.MOCK_DATA.initialHabits));
        goals.value = JSON.parse(JSON.stringify(window.MOCK_DATA.initialGoals));
        summaries.value = JSON.parse(JSON.stringify(window.MOCK_DATA.initialSummaries));
        activePeriod.value = '日';
        showToast('数据已重置');
      };

      return {
        // 全局
        currentTab,
        showFrame,
        togglePhoneFrame,
        toastMessage,
        currentHourTime,
        navItems,
        currentHeaderConfig,
        resetSampleData,

        // Day (时序)
        dayOffset,
        isToday,
        currentDateObj,
        selectedDateLine,
        tasksByDate,
        currentTasks,
        completedTasksCount,
        taskRingOffset,
        onToggleTask,
        onEditTask,
        onAddTask,
        showDatePicker,
        openDatePicker,
        onSelectCalendarDate,
        onSelectToday,
        showTaskModal,
        editingTask,
        onSaveTask,
        onDeleteTask,

        // Habits (习惯)
        habits,
        completedHabitsCount,
        showHabitModal,
        onToggleHabit,
        onSaveHabit,

        // Direction (所向)
        goals,
        onClickGoal,

        // Summary (总结)
        activePeriod,
        summaries,
        currentSummaries,
        showSummaryModal,
        onSaveSummary,

        // FAB
        handleFabClick
      };
    }
  });

  // 注册全局原子及布局组件
  app.component('lucide-icon', window.LucideIcon);
  app.component('app-header', window.AppHeader);
  app.component('tab-bar', window.TabBar);
  app.component('day-view', window.DayView);
  app.component('habits-view', window.HabitsView);
  app.component('direction-view', window.DirectionView);
  app.component('summary-view', window.SummaryView);
  app.component('date-picker-drawer', window.DatePickerDrawer);
  app.component('task-modal', window.TaskModal);
  app.component('habit-modal', window.HabitModal);
  app.component('summary-modal', window.SummaryModal);

  app.mount('#app');
})();
