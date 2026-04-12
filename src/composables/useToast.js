import { toaster } from 'vue-sonner'

export function useToast() {
  const toast = {
    success: (message) => toaster.success(message, { duration: 3000 }),
    error: (message) => toaster.error(message, { duration: 3000 }),
    warning: (message) => toaster.warning(message, { duration: 3000 }),
    info: (message) => toaster.info(message, { duration: 3000 }),
  }

  return { toast }
}
