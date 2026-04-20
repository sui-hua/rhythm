<template>
  <Dialog :open="showCategoryModal" @update:open="showCategoryModal = $event">
    <DialogContent class="modal-content">
      <DialogHeader>
        <DialogTitle class="modal-title">类型管理</DialogTitle>
      </DialogHeader>

      <div class="category-manager">
        <!-- 添加新类别 -->
        <div class="add-category">
          <Input
            v-model="newCategoryName"
            placeholder="输入新类型名称"
            class="category-input"
            @keyup.enter="handleAddCategory"
          />
          <Button @click="handleAddCategory" size="sm" class="add-button">
            <Plus class="w-4 h-4 mr-1" />
            添加
          </Button>
        </div>

        <!-- 类别列表 -->
        <ScrollArea class="category-list">
          <div v-if="loading" class="loading-state">加载中...</div>
          <div v-else-if="categories.length === 0" class="empty-state">暂无类型</div>
          <div v-else class="list-container">
            <div v-for="cat in categories" :key="cat.id" class="category-item">
              <span class="category-name">{{ cat.name }}</span>
              <button class="delete-btn" @click="handleDeleteCategory(cat.id)">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </ScrollArea>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showCategoryModal = false">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

/**
 * CategoryManagementModal.vue
 * 
 * 类型管理模态框组件
 * 
 * 功能说明：
 * - 提供类别的增删查功能，用于管理长期目标的分类体系
 * - 添加新类别：用户输入名称后点击添加或按回车确认
 * - 查看类别列表：滚动区域展示所有已创建的类别
 * - 删除类别：点击删除按钮并二次确认后移除类别
 * 
 * 数据流：
 * - categories: 从 useDirectionState() 获取的响应式类别列表
 * - showCategoryModal: 控制模态框的显示/隐藏状态
 * - 操作完成后通过 emit('updated') 通知父组件刷新数据
 * 
 * 依赖服务：
 * - db.plansCategory: 数据库的类别表操作接口 (list/create/delete)
 * - useDirectionState: Direction 模块的全局状态管理
 * 
 * 使用场景：
 * - 在 Direction 页面中，通过"类型管理"按钮打开此模态框
 */
<script setup>
import { ref, onMounted } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2 } from 'lucide-vue-next'
import { db } from '@/services/database'
import { useDirectionState } from '@/views/direction/composables/useDirectionState'

// 新类别名称的输入值（双向绑定）
const newCategoryName = ref('')
// 加载状态标识，控制列表区域的加载反馈
const loading = ref(false)

// 从全局状态中获取模态框显示状态和类别列表
const { showCategoryModal, categories } = useDirectionState()

// 定义组件向上传递的事件：updated - 类别数据更新后通知父组件
const emit = defineEmits(['updated'])

// 从数据库获取最新的类别列表并更新响应式状态
const fetchCategories = async () => {
  loading.value = true
  try {
    categories.value = await db.plansCategory.list()
  } catch (e) {
    console.error('Failed to fetch categories:', e)
  } finally {
    loading.value = false
  }
}

// 处理添加新类别的逻辑
// 1. 校验输入非空
// 2. 调用数据库接口创建类别
// 3. 清空输入框并刷新列表
// 4. 通知父组件数据已更新
const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) return
  try {
    await db.plansCategory.create({ name: newCategoryName.value.trim() })
    newCategoryName.value = ''
    await fetchCategories()
    emit('updated')
  } catch (e) {
    console.error('Failed to add category:', e)
  }
}

// 处理删除类别的逻辑
// 1. 弹出浏览器原生确认框进行二次确认
// 2. 确认后调用数据库接口删除指定类别
// 3. 刷新列表并通知父组件
const handleDeleteCategory = async (id) => {
  if (!confirm('确定要删除这个类型吗？')) return
  try {
    await db.plansCategory.delete(id)
    await fetchCategories()
    emit('updated')
  } catch (e) {
    console.error('Failed to delete category:', e)
  }
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.modal-content {
  @apply sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background;
}

.modal-title {
  @apply text-xl font-bold tracking-tight;
}

.category-manager {
  @apply flex flex-col gap-4 py-4;
}

.add-category {
  @apply flex gap-2;
}

.category-input {
  @apply flex-1 h-9;
}

.add-button {
  @apply h-9 px-4;
}

.category-list {
  @apply h-[250px] border rounded-md p-2;
}

.list-container {
  @apply flex flex-col gap-1;
}

.category-item {
  @apply flex items-center justify-between p-2 hover:bg-zinc-50 rounded transition-colors;
}

.category-name {
  @apply text-sm font-medium;
}

.delete-btn {
  @apply p-1 text-muted-foreground hover:text-destructive transition-colors;
}

.loading-state, .empty-state {
  @apply h-full flex items-center justify-center text-sm text-muted-foreground;
}
</style>
