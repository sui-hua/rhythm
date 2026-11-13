// ========================================================
// 交互弹窗群：TaskModal / HabitModal / SummaryModal
// ========================================================

// 1. 新建/编辑待办事项抽屉
window.TaskModal = {
  name: 'TaskModal',
  props: {
    show: { type: Boolean, default: false },
    task: { type: Object, default: null }
  },
  emits: ['update:show', 'save', 'delete'],
  setup(props, { emit }) {
    const { ref, watch } = Vue;

    const form = ref({ title: '', time: '09:00', duration: 30 });

    watch(() => props.show, (val) => {
      if (val) {
        if (props.task) {
          form.value = {
            title: props.task.title,
            time: props.task.time || '09:00',
            duration: props.task.duration || 30
          };
        } else {
          form.value = { title: '', time: '09:00', duration: 30 };
        }
      }
    });

    const close = () => emit('update:show', false);

    const onSave = () => {
      if (!form.value.title.trim()) return;
      emit('save', {
        id: props.task ? props.task.id : null,
        title: form.value.title.trim(),
        time: form.value.time || '09:00',
        duration: Number(form.value.duration) || 30
      });
      close();
    };

    const onDelete = () => {
      if (props.task) {
        emit('delete', props.task.id);
      }
      close();
    };

    return { form, close, onSave, onDelete };
  },
  template: `
    <div v-if="show" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center" @click.self="close">
      <div class="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100">
        <div class="w-9 h-1 bg-zinc-200 rounded-full mx-auto"></div>
        <div class="flex items-center justify-between pb-1">
          <h2 class="text-base font-bold tracking-tight text-zinc-900">{{ task ? '编辑事项' : '新建事项' }}</h2>
          <button @click="close" class="text-zinc-400 hover:text-zinc-900 p-1">
            <lucide-icon name="x" :size="16"></lucide-icon>
          </button>
        </div>

        <div class="space-y-3">
          <input
            v-model="form.title"
            type="text"
            placeholder="写下你想做的事..."
            class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
            @keyup.enter="onSave"
          />

          <div class="flex items-center gap-3 text-xs text-zinc-500 font-medium">
            <span>开始时间:</span>
            <input
              v-model="form.time"
              type="time"
              class="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono"
            />
            <span class="ml-2">时长:</span>
            <input
              v-model.number="form.duration"
              type="number"
              step="5"
              class="w-16 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono"
            />
            <span>分钟</span>
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-2">
          <button v-if="task" @click="onDelete" class="px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
            删除
          </button>
          <button @click="onSave" class="flex-1 py-2.5 bg-zinc-900 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all">
            保存事项
          </button>
        </div>
      </div>
    </div>
  `
};

// 2. 新建习惯抽屉
window.HabitModal = {
  name: 'HabitModal',
  props: {
    show: { type: Boolean, default: false }
  },
  emits: ['update:show', 'save'],
  setup(props, { emit }) {
    const { ref } = Vue;
    const title = ref('');
    const frequency = ref('每日');

    const close = () => {
      emit('update:show', false);
      title.value = '';
      frequency.value = '每日';
    };

    const onSave = () => {
      if (!title.value.trim()) return;
      emit('save', {
        title: title.value.trim(),
        frequency: frequency.value
      });
      close();
    };

    return { title, frequency, close, onSave };
  },
  template: `
    <div v-if="show" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center" @click.self="close">
      <div class="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100">
        <div class="w-9 h-1 bg-zinc-200 rounded-full mx-auto"></div>
        <div class="flex items-center justify-between pb-1">
          <h2 class="text-base font-bold tracking-tight text-zinc-900">添加日常习惯</h2>
          <button @click="close" class="text-zinc-400 hover:text-zinc-900 p-1">
            <lucide-icon name="x" :size="16"></lucide-icon>
          </button>
        </div>

        <div class="space-y-3">
          <input
            v-model="title"
            type="text"
            placeholder="例如：早起晨读 30 分钟"
            class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
            @keyup.enter="onSave"
          />
          <div class="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span>重复频率:</span>
            <select v-model="frequency" class="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900">
              <option value="每日">每日</option>
              <option value="工作日">工作日</option>
              <option value="每周3次">每周3次</option>
            </select>
          </div>
        </div>

        <button @click="onSave" class="w-full py-2.5 bg-zinc-900 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all">
          确认添加
        </button>
      </div>
    </div>
  `
};

// 3. 记录复盘总结抽屉
window.SummaryModal = {
  name: 'SummaryModal',
  props: {
    show: { type: Boolean, default: false },
    period: { type: String, default: '日' }
  },
  emits: ['update:show', 'save'],
  setup(props, { emit }) {
    const { ref } = Vue;
    const text = ref('');

    const close = () => {
      emit('update:show', false);
      text.value = '';
    };

    const onSave = () => {
      if (!text.value.trim()) return;
      emit('save', {
        text: text.value.trim(),
        period: props.period
      });
      close();
    };

    return { text, close, onSave };
  },
  template: `
    <div v-if="show" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center" @click.self="close">
      <div class="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100">
        <div class="w-9 h-1 bg-zinc-200 rounded-full mx-auto"></div>
        <div class="flex items-center justify-between pb-1">
          <h2 class="text-base font-bold tracking-tight text-zinc-900">记录{{ period }}度复盘反思</h2>
          <button @click="close" class="text-zinc-400 hover:text-zinc-900 p-1">
            <lucide-icon name="x" :size="16"></lucide-icon>
          </button>
        </div>

        <textarea
          v-model="text"
          rows="4"
          placeholder="今天有什么心得、感悟或者收获？"
          class="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 leading-relaxed font-normal"
        ></textarea>

        <button @click="onSave" class="w-full py-2.5 bg-zinc-900 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all">
          保存复盘记录
        </button>
      </div>
    </div>
  `
};
