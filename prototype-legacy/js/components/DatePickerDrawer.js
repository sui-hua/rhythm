// ========================================================
// 极简高质感抽屉：微型日历选择器 (DatePickerDrawer)
// ========================================================

window.DatePickerDrawer = {
  name: 'DatePickerDrawer',
  props: {
    show: { type: Boolean, default: false },
    currentDateObj: { type: Date, required: true },
    tasksByDate: { type: Object, default: () => ({}) },
    isToday: { type: Boolean, default: true }
  },
  emits: ['update:show', 'select-date', 'select-today'],
  setup(props, { emit }) {
    const { ref, computed, watch } = Vue;

    const pickerYear = ref(props.currentDateObj.getFullYear());
    const pickerMonth = ref(props.currentDateObj.getMonth());

    watch(() => props.show, (newVal) => {
      if (newVal) {
        pickerYear.value = props.currentDateObj.getFullYear();
        pickerMonth.value = props.currentDateObj.getMonth();
      }
    });

    const pickerYearMonthTitle = computed(() => {
      return `${pickerYear.value}年 ${pickerMonth.value + 1}月`;
    });

    const changePickerMonth = (delta) => {
      pickerMonth.value += delta;
      if (pickerMonth.value > 11) {
        pickerMonth.value = 0;
        pickerYear.value++;
      } else if (pickerMonth.value < 0) {
        pickerMonth.value = 11;
        pickerYear.value--;
      }
    };

    const calendarCells = computed(() => {
      const cells = [];
      const y = pickerYear.value;
      const m = pickerMonth.value;

      const firstDayWeekday = new Date(y, m, 1).getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const prevDaysCount = new Date(y, m, 0).getDate();

      // 上个月占位格
      for (let i = firstDayWeekday - 1; i >= 0; i--) {
        cells.push({ day: prevDaysCount - i, isCurrentMonth: false });
      }

      // 当月日期
      const selY = props.currentDateObj.getFullYear();
      const selM = props.currentDateObj.getMonth();
      const selD = props.currentDateObj.getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const isSel = (y === selY && m === selM && d === selD);
        const isTod = (y === 2026 && m === 4 && d === 11);
        const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasT = (props.tasksByDate[dateKey] && props.tasksByDate[dateKey].length > 0);
        cells.push({
          day: d,
          isCurrentMonth: true,
          isSelected: isSel,
          isToday: isTod,
          hasTasks: hasT
        });
      }

      // 下个月补足 7 的倍数
      let nextDay = 1;
      while (cells.length % 7 !== 0) {
        cells.push({ day: nextDay++, isCurrentMonth: false });
      }

      return cells;
    });

    const onSelectDay = (day) => {
      const target = new Date(pickerYear.value, pickerMonth.value, day);
      emit('select-date', target);
      emit('update:show', false);
    };

    const onSelectToday = () => {
      emit('select-today');
      pickerYear.value = 2026;
      pickerMonth.value = 4;
      emit('update:show', false);
    };

    const close = () => {
      emit('update:show', false);
    };

    return {
      pickerYearMonthTitle,
      changePickerMonth,
      calendarCells,
      onSelectDay,
      onSelectToday,
      close
    };
  },
  template: `
    <div v-if="show" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center" @click.self="close">
      <div class="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100">
        <!-- 抽屉顶部手柄 -->
        <div class="w-9 h-1 bg-zinc-200 rounded-full mx-auto"></div>

        <!-- 抽屉标题与快捷切换 -->
        <div class="flex items-center justify-between pb-1">
          <div class="flex items-center gap-1.5">
            <span class="text-base font-bold tracking-tight text-zinc-900 font-sans">{{ pickerYearMonthTitle }}</span>
            <div class="flex items-center text-zinc-400 ml-1">
              <button @click="changePickerMonth(-1)" class="p-1 hover:text-zinc-900 transition-colors" title="上个月">
                <lucide-icon name="chevron-left" :size="15"></lucide-icon>
              </button>
              <button @click="changePickerMonth(1)" class="p-1 hover:text-zinc-900 transition-colors" title="下个月">
                <lucide-icon name="chevron-right" :size="15"></lucide-icon>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="!isToday"
              @click="onSelectToday"
              class="px-2.5 py-1 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors active:scale-95"
            >
              回今天
            </button>
            <button @click="close" class="text-zinc-400 hover:text-zinc-900 p-1">
              <lucide-icon name="x" :size="16"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- 星期表头 -->
        <div class="grid grid-cols-7 text-center text-[11px] font-mono font-semibold text-zinc-400 pb-1">
          <span>日</span>
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
        </div>

        <!-- 日历单元格网格 -->
        <div class="grid grid-cols-7 gap-y-1.5 text-center">
          <button
            v-for="(cell, idx) in calendarCells"
            :key="idx"
            @click="cell.isCurrentMonth && onSelectDay(cell.day)"
            :disabled="!cell.isCurrentMonth"
            class="relative w-9 h-9 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-mono font-medium transition-all"
            :class="[
              !cell.isCurrentMonth ? 'text-zinc-300 pointer-events-none' : 'hover:bg-zinc-100',
              cell.isSelected ? 'bg-zinc-900 text-white font-bold shadow-xs hover:bg-zinc-900 scale-105' : 'text-zinc-800',
              cell.isToday && !cell.isSelected ? 'font-bold border border-zinc-900 text-zinc-900' : ''
            ]"
          >
            <span>{{ cell.day }}</span>
            <span v-if="cell.hasTasks && !cell.isSelected" class="w-1 h-1 rounded-full bg-zinc-400 absolute bottom-1"></span>
          </button>
        </div>

        <!-- 底部快捷提示 -->
        <div class="pt-1 text-center border-t border-zinc-100">
          <p class="text-[11px] font-medium text-zinc-400">轻触日期快速跳转 · 专注当下节奏</p>
        </div>
      </div>
    </div>
  `
};
