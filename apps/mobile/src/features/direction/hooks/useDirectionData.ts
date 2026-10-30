import { useQuery } from '@tanstack/react-query'
import { listGoalCategories, listGoalOverview } from '@/services/api/goals'

/** 方向页数据：目标三级结构 + 分类列表 */
export function useDirectionData() {
  const goalsQuery = useQuery({
    queryKey: ['goals', 'overview'],
    queryFn: () => listGoalOverview()
  })

  const categoriesQuery = useQuery({
    queryKey: ['goal-categories'],
    queryFn: () => listGoalCategories()
  })

  return {
    goals: goalsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    isLoading: goalsQuery.isLoading || categoriesQuery.isLoading,
    errors: [goalsQuery.error, categoriesQuery.error].filter(Boolean),
    refetch: () => {
      void goalsQuery.refetch()
      void categoriesQuery.refetch()
    }
  }
}
