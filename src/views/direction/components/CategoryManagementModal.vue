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

<script setup>
import { ref, onMounted } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2 } from 'lucide-vue-next'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { showCategoryModal, categories } from '@/views/direction/composables/useDirectionState'
const newCategoryName = ref('')
const loading = ref(false)
const authStore = useAuthStore()

const emit = defineEmits(['updated'])

const fetchCategories = async () => {
  loading.value = true
  try {
    categories.value = await db.goalCategories.list()
  } catch (e) {
    console.error('Failed to fetch categories:', e)
  } finally {
    loading.value = false
  }
}

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) return
  if (!authStore.userId) return
  try {
    await db.goalCategories.create({
      name: newCategoryName.value.trim(),
      user_id: authStore.userId
    })
    newCategoryName.value = ''
    await fetchCategories()
    emit('updated')
  } catch (e) {
    console.error('Failed to add category:', e)
  }
}

const handleDeleteCategory = async (id) => {
  if (!confirm('确定要删除这个类型吗？')) return
  try {
    await db.goalCategories.delete(id)
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
