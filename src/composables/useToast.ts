import { toast } from 'vue-sonner'

interface UseToastReturn {
  toast: typeof toast
}

export function useToast(): UseToastReturn {
  return { toast }
}
