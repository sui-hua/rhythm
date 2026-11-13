// ========================================================
// 移动端原型初始 Mock 数据与字典
// ========================================================

window.MOCK_DATA = {
  // 底部导航栏配置
  navItems: [
    { key: 'day', name: '时序', icon: 'layout-grid' },
    { key: 'habits', name: '习惯', icon: 'circle-check' },
    { key: 'direction', name: '所向', icon: 'compass' },
    { key: 'summary', name: '总结', icon: 'book-open' }
  ],

  // 待办基准事项列表（5月11日）
  initialTasks: [
    { id: 1, title: '晨间专注阅读《思考，快与慢》', time: '07:30', duration: 45, completed: true },
    { id: 2, title: '架构方案设计与审美规范梳理', time: '08:30', duration: 60, completed: true },
    { id: 3, title: '移动端交互极简原型精修推演', time: '10:00', duration: 90, completed: false, isNow: true },
    { id: 4, title: '午餐与能量恢复', time: '12:30', duration: 40, completed: true },
    { id: 5, title: '核心接口细节核验', time: '14:00', duration: 120, completed: false },
    { id: 6, title: '晚间运动健身 5km', time: '17:30', duration: 45, completed: false },
    { id: 7, title: '全天复盘与日总结', time: '20:30', duration: 30, completed: false }
  ],

  // 多日期任务字典
  getInitialTasksByDate() {
    return {
      '2026-05-11': JSON.parse(JSON.stringify(this.initialTasks)),
      '2026-05-10': [
        { id: 101, title: '周末反思与下周计划梳理', time: '10:00', duration: 60, completed: true },
        { id: 102, title: '长跑训练 10km', time: '16:30', duration: 60, completed: true },
        { id: 103, title: '家庭晚餐与电影时光', time: '19:00', duration: 120, completed: true }
      ],
      '2026-05-12': [
        { id: 201, title: '技术方案终审沟通会', time: '09:30', duration: 60, completed: false },
        { id: 202, title: '移动端交互手势与反馈调优', time: '14:00', duration: 90, completed: false },
        { id: 203, title: '阅读专业技术周刊', time: '21:00', duration: 30, completed: false }
      ]
    };
  },

  // 习惯列表
  initialHabits: [
    { id: 101, title: '早起晨读', streak: 11, frequency: '每日', completedToday: true },
    { id: 102, title: '跑步健身 5km', streak: 4, frequency: '每周3次', completedToday: false },
    { id: 103, title: '正念冥想 15 分钟', streak: 8, frequency: '每日', completedToday: true }
  ],

  // 长期目标 (所向)
  initialGoals: [
    { id: 201, title: '掌握现代化全栈与 AI 架构', category: '学习', milestone: '5月：完成高保真原型交互演进与规范核验', progress: 75 },
    { id: 202, title: '心肺耐力提升 20km/周', category: '健康', milestone: '5月：周跑量稳定 20km，配速 5:30', progress: 60 },
    { id: 203, title: '个人财务被动储蓄计划', category: '财务', milestone: '5月：结余转入指数基金标的', progress: 40 },
    { id: 204, title: '深度阅读人文沉淀', category: '思维', milestone: '5月：精读《思考，快与慢》全本', progress: 85 }
  ],

  // 复盘总结
  initialSummaries: [
    { id: 301, period: '日', date: '5月10日 昨天', text: '保持克制与节奏感，完成了核心架构审查与移动端原型推演，心流状态稳定。' },
    { id: 302, period: '日', date: '5月9日 前天', text: '完成 5km 户外跑步，深度睡眠充分，身心能量恢复良好，生活步调井然有序。' },
    { id: 303, period: '日', date: '5月8日 星期五', text: '梳理了全天待办清单并完成核心接口细节核验，晚间深度复盘，心绪宁静。' },
    { id: 304, period: '周', date: '5月第 1 周', text: '推进了规范梳理与接口契约落地，整体工程与产品节奏稳定，未出现拖延。' },
    { id: 305, period: '月', date: '2026年4月', text: '完成了年度目标第一阶段冲刺，生活规律度提升，运动打卡达成率 90%。' }
  ]
};
