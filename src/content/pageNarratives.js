export const pageNarratives = {
  day: {
    title: '时序',
    subtitle: '把今天真正会发生的执行动作排清楚。',
    emptyTitle: '今天还没有安排',
    emptyDescription: '先添加一件任务、一个习惯，或从所向承诺项里开始今天。'
  },
  habits: {
    title: '习惯',
    subtitle: '记录那些需要长期维持的节律，而不是一次性完成的事项。',
    emptyTitle: '先创建第一个习惯',
    emptyDescription: '从一个最容易坚持的动作开始，让今天有稳定的节奏。'
  },
  direction: {
    title: '所向',
    subtitle: '把长期目标拆到月，再把真正承诺推进的内容落到今天。',
    emptyTitle: '先定义一个目标',
    emptyDescription: '目标明确后，所向里的月度编排和日承诺才会真正成立。'
  },
  summary: {
    title: '总结',
    subtitle: '把已经发生的执行、习惯和阶段进展沉淀成可以回看的记录。',
    emptyTitle: '还没有可回看的总结',
    emptyDescription: '从一条日总结开始，后面周、月、年的回顾都会更轻松。'
  }
}

const fallbackNarrative = {
  title: '',
  subtitle: '',
  emptyTitle: '',
  emptyDescription: ''
}

export const getPageNarrative = (key) => pageNarratives[key] || fallbackNarrative
