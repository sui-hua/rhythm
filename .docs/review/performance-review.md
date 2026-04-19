# 性能审查报告

## 1. 日视图每秒刷新且未清理定时器，页面停留越久越容易出现无效渲染和内存泄漏
- 标题：日视图秒级定时刷新未释放
- 证据（文件/函数/组件）：
  - `src/views/day/composables/useDayNavigation.js` 的 `onMounted()` 和 `updateCurrentHour()`，第 `127-141` 行
  - `src/views/day/index.vue` 中 `Timeline` 持续接收 `currentHour`，第 `161-185` 行
- 问题：
  - 日视图进入后会 `setInterval(updateCurrentHour, 1000)`，但没有保存 timer id，也没有在卸载时 `clearInterval`。
  - 同时 `currentHour` 每秒变化会推动 `Timeline` 组件树持续更新。
- 原因：
  - 当前时间线只需要分钟级甚至 30 秒级精度，但实现成了秒级刷新。
  - 定时器创建在 composable 内，没有配套的 `onUnmounted` 清理。
- 影响：
  - 路由多次进入/离开日视图后，会累积多个孤儿定时器，带来持续 CPU 占用。
  - 时间轴、任务卡片所在父组件会被高频唤起渲染，任务多时滚动和交互会越来越卡。
- 建议：
  - 将刷新频率降到 30 秒或 60 秒，或者只在分钟变化时更新。
  - 保存 interval id，并在 `onUnmounted` 中清理。
  - 让 `TimelineMarker` 自己消费时间信号，避免整个 `Timeline` 因时间线指针变化而重绘。
- 优先级：高

## 2. 日视图一次操作后会整页重拉 4 份数据，数据加载成本偏高
- 标题：日视图写操作后全量重取任务/计划/习惯/日志
- 证据（文件/函数/组件）：
  - `src/views/day/composables/useDayData.js` 的 `fetchTasks()`，第 `68-105` 行
  - 同文件的 `handleToggleComplete()`，第 `271-305` 行
  - 同文件的 `handleStartTask()`，第 `310-320` 行附近
- 问题：
  - `fetchTasks()` 每次都会并发请求 `tasks.list`、`dailyPlans.listByDate`、`habits.listLite`、`habits.listLogsByDate` 四份数据。
  - 勾选任务、勾选习惯、切换日计划状态、开始任务计时后，都会再次调用 `fetchTasks({ showLoading: false })` 做全量刷新。
- 原因：
  - 当前状态更新策略是“写完即整页重拉”，没有针对单条数据做局部 patch。
  - 习惯列表是跨天稳定数据，但也被放进日视图的每次刷新链路里。
- 影响：
  - 高频交互场景下会产生多次冗余请求，尤其是连续打勾或移动端快速操作时更明显。
  - 页面会重复组装 `dailySchedule`，加重主线程压力，放大时间轴和侧栏的重复渲染。
- 建议：
  - 将 `tasks`、`dailyPlans`、`habitLogs` 分开更新，写操作后只 patch 当前受影响的集合。
  - `habits.listLite()` 做按会话缓存，除非习惯本身被修改，否则不要在每次完成状态切换后重取。
  - 对“开始任务计时”“切换完成状态”引入 optimistic update，失败再回滚。
- 优先级：高

## 3. 方向页切换目标时会对同一个月计划发起重复请求，并且缺少并发保护
- 标题：方向页目标切换触发重复加载与竞态
- 证据（文件/函数/组件）：
  - `src/views/direction/composables/useDirectionFetch.js` 的 `watch(selectedGoal, ...)`，第 `180-205` 行
  - 同文件的 `watch(selectedMonth, ...)`，第 `162-178` 行
  - 同文件的 `loadDailyPlans()`，第 `83-109` 行
- 问题：
  - `selectedGoal` 变化时，代码先设置 `selectedMonth.value = firstMonth`，随后又显式 `await loadDailyPlans(firstMp.id, { force: true })`。
  - 由于 `selectedMonth` watcher 也会执行 `loadDailyPlans(mp.id, { force: true })`，同一个月的数据会被拉两次。
  - 这些请求没有 request token / abort / 版本号保护，快速切换目标时旧请求可能覆盖新状态。
- 原因：
  - `selectedGoal` watcher 和 `selectedMonth` watcher 之间职责重叠，都在负责“首次月数据预加载”。
  - `force: true` 直接绕过缓存，放大了重复请求。
- 影响：
  - 目标切换会产生无意义的双请求，网络慢时尤为明显。
  - 快速切换目标或月份时，面板可能闪动、回写旧数据，用户会感知到“点了 A 却闪回 B”的卡顿。
- 建议：
  - 把“设置默认月份”和“触发月数据加载”收敛到一处，只保留单一入口。
  - 给 `loadDailyPlans` 增加 in-flight map，同一个 `monthlyPlanId` 的请求复用 Promise。
  - 为异步结果增加版本号校验，只有最后一次选择对应的请求才允许落库到响应式状态。
- 优先级：高

## 4. 习惯页写操作会引发“全量习惯列表 + 当前习惯全部日志”双重重拉，首屏和交互成本都偏大
- 标题：习惯页刷新粒度过粗
- 证据（文件/函数/组件）：
  - `src/views/habits/composables/useHabitLogs.js` 的 `toggleComplete()`、`handleQuickLog()`，第 `75-148` 行
  - `src/views/habits/composables/useHabitData.js` 的 `fetchHabits()`，第 `129-160` 行
  - `src/views/habits/index.vue` 的 `watch(selectedHabit, ...)`，第 `131-136` 行
- 问题：
  - 习惯打卡和快速记录成功后，都会调用 `fetchHabits()` 全量重拉全部习惯。
  - `fetchHabits()` 会重建 `selectedHabit` 对象，进而触发 `watch(selectedHabit)` 再去请求一次 `fetchLogsForHabit(newHabit.id)`。
  - 结果是一次打卡至少触发“全量习惯列表请求 + 当前习惯全量日志请求”两轮刷新。
- 原因：
  - 页面把“列表刷新”和“当前详情刷新”耦合在一起，没有局部更新能力。
  - `selectedHabit` 依赖对象身份变化触发 watcher，而不是只在 id 变化时触发。
- 影响：
  - 习惯多、日志多时，点击日历打卡会明显发慢。
  - 主内容区、侧边栏、统计卡、日志列表都会整体重算，页面有肉眼可见的重绘感。
- 建议：
  - 打卡后仅局部更新 `selectedHabit.monthlyLogs`、`completedDays`、`total`、`streak`。
  - `watch(selectedHabit, ...)` 改为只监听 `selectedHabit?.id`，避免对象重建导致重复请求。
  - `fetchHabits()` 只在新增/删除/编辑习惯时调用，打卡动作不要整页刷新。
- 优先级：高

## 5. 习惯日志是“全量查询 + 全量排序 + 全量渲染”，日志变多后会拖慢详情页
- 标题：习惯日志缺少分页与增量加载
- 证据（文件/函数/组件）：
  - `src/services/db/habits.js` 的 `listLogsByHabit()`，第 `51-61` 行
  - `src/views/habits/composables/useHabitData.js` 的 `fetchLogsForHabit()`，第 `166-208` 行
  - `src/views/habits/components/HabitLogs.vue`，第 `11-27` 行
  - `src/views/habits/composables/useHabitLogs.js` 的 `useHabitLogsFormatter()`，第 `35-50` 行
- 问题：
  - 当前会把某个习惯的全部历史日志一次性查出来，再在前端做全量 map/sort，最后一次性渲染成卡片列表。
  - 没有分页、没有“最近 30 条”限制，也没有虚拟列表。
- 原因：
  - 数据层接口只提供全量 `listLogsByHabit(habitId)`。
  - 展示层默认把“完整历史”当作首屏内容。
- 影响：
  - 长期使用后的老习惯会让切换详情页越来越慢。
  - JS 排序和 DOM 节点数同步增长，滚动性能和首次展示时间都会下降。
- 建议：
  - 查询层改成分页接口，默认只拉最近 30-50 条日志。
  - 统计所需的 `streak/total` 尽量在 SQL/RPC 层聚合，避免前端每次拿全量历史再重算。
  - 日志列表引入“加载更多”或虚拟滚动。
- 优先级：中

## 6. 日视图同时渲染侧栏列表和时间轴卡片，缺少分层更新策略，任务密集日会放大渲染成本
- 标题：同一份日程数据被双区域全量渲染
- 证据（文件/函数/组件）：
  - `src/views/day/components/Sidebar.vue` 的 `v-for="(item, index) in dailySchedule"`，第 `38-124` 行
  - `src/views/day/components/Timeline.vue` 的 `displaySchedule` 和 `TaskItem` 渲染， 第 `33-41`、`70-112` 行
  - `src/views/day/components/TaskItem.vue` 的重样式卡片结构，第 `1-166` 行
- 问题：
  - 同一份 `dailySchedule` 在侧栏和时间轴各渲染一套 DOM，时间轴还会先做一次 `map + sort + packEvents`。
  - `TaskItem` 使用了较重的视觉样式和多层 computed，任务密集时主线程压力会成倍增长。
- 原因：
  - 当前以“完整镜像”的方式实现双视图，没有做列表虚拟化，也没有把重布局计算结果缓存到数据层。
  - 侧栏和时间轴都直接依赖响应式源数据，任何刷新都会同时影响两个区域。
- 影响：
  - 日程条目较多或拖慢设备上，首屏布局、切换日期、批量勾选后的回流与重绘会明显增加。
  - 再叠加第 1 条的秒级刷新和第 2 条的全量重取，卡顿会被进一步放大。
- 建议：
  - 将 `displaySchedule` 的布局计算下沉到数据层，并缓存到仅在日程变更时更新。
  - 为侧栏或日志区域引入虚拟列表，至少保证只有一个区域做全量卡片渲染。
  - 对非可见任务采用分段渲染或延后挂载，减少首屏 DOM 体积。
- 优先级：中

## 7. 通知能力初始化重复，轮询策略也偏粗，长期停留日视图会持续做无差别检查
- 标题：通知注册与轮询策略偏重
- 证据（文件/函数/组件）：
  - `src/App.vue` 的 `requestPermission()`，第 `67-71` 行
  - `src/views/day/index.vue` 的 `requestPermission()` + `startListening()`，第 `181-185` 行
  - `src/composables/useNotifications.js` 的 `startListening()`，第 `156-197` 行
- 问题：
  - 登录成功后在 `App.vue` 请求一次通知权限，进入日视图又请求一次。
  - 日视图开启监听后，每 30 秒都会重新取一遍 `dailySchedule` 并执行 `syncTasksToSw`、`checkAndNotify`，没有根据“下一次最近提醒时间”做自适应调度。
- 原因：
  - 通知权限初始化分散在根组件和业务页面两个入口。
  - 轮询方案没有利用任务时间分布做稀疏调度。
- 影响：
  - 会产生重复初始化、重复 Service Worker 注册尝试。
  - 长时间打开日视图时，页面会持续做无差别扫描，任务多时会平白消耗 CPU。
- 建议：
  - 把权限申请和 Service Worker 注册统一收口到一个全局初始化点。
  - 根据最近一个未提醒任务的时间动态设定下次检查时刻，非临近提醒窗口不要固定 30 秒轮询。
  - 若已有 Service Worker 接管提醒，前台轮询应降级为前台可见时的兜底，而不是常驻主方案。
- 优先级：中
