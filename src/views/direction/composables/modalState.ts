// modalState.ts
// Direction 模块弹窗显示状态的共享引用
// 独立模块避免 useDirectionGoals ↔ useDirectionFetch 循环依赖

import { ref } from 'vue'

// 新增目标弹窗显示状态，所有 composable 和组件共享同一引用
export const showAddModal = ref<boolean>(false)
// 分类管理弹窗显示状态
export const showCategoryModal = ref<boolean>(false)
