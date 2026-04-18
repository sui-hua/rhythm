/**
 * ============================================
 * Dialog 对话框组件 (components/ui/dialog/)
 * ============================================
 *
 * 【模块职责】
 * - 基于 Radix Vue Dialog 的模态对话框组件
 * - 支持自定义头部、内容、底部结构
 *
 * 【使用方式】
 * <Dialog v-model:open="isOpen">
 *   <DialogTrigger>打开</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>标题</DialogTitle>
 *       <DialogDescription>描述</DialogDescription>
 *     </DialogHeader>
 *     <div>内容</div>
 *     <DialogFooter>底部</DialogFooter>
 *   </DialogContent>
 * </Dialog>
 */
export { default as Dialog } from './Dialog.vue'
export { default as DialogTrigger } from './DialogTrigger.vue'
export { default as DialogHeader } from './DialogHeader.vue'
export { default as DialogFooter } from './DialogFooter.vue'
export { default as DialogContent } from './DialogContent.vue'
export { default as DialogTitle } from './DialogTitle.vue'
export { default as DialogDescription } from './DialogDescription.vue'
