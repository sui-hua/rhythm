import supabase from '../config/supabase.js'

class DatabaseService {
  constructor() {
    this.supabase = supabase
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  async getUserId() {
    const user = await this.getCurrentUser()
    return user?.id
  }

  async getTasksByDateRange(startDate, endDate) {
    const userId = await this.getUserId()
    if (!userId) return { data: [], error: 'User not authenticated' }

    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        task_categories (
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      return { data: [], error }
    }

    const formattedData = data.map(task => ({
      ...task,
      category_name: task.task_categories?.name,
      category_color: task.task_categories?.color,
      category_icon: task.task_categories?.icon,
      startHour: this._timeToHours(task.start_time),
      time: this._formatTime(task.start_time),
      duration: `${task.duration_hours}H`
    }))

    return { data: formattedData, error: null }
  }

  async getTasksByDate(date) {
    const { data, error } = await this.getTasksByDateRange(date, date)
    return { data, error }
  }

  async getMonthStats(year, month) {
    const userId = await this.getUserId()
    if (!userId) return { data: [], error: 'User not authenticated' }

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await this.supabase
      .from('tasks')
      .select('start_date, completed')
      .eq('user_id', userId)
      .gte('start_date', startDate)
      .lte('start_date', endDate)

    if (error) {
      console.error('Error fetching month stats:', error)
      return { data: [], error }
    }

    const stats = {}
    data.forEach(task => {
      const day = new Date(task.start_date).getDate()
      if (!stats[day]) {
        stats[day] = { taskCount: 0, completedCount: 0, taskHours: [] }
      }
      stats[day].taskCount++
      if (task.completed) {
        stats[day].completedCount++
      }
      const taskDate = new Date(task.start_date + 'T' + task.start_time)
      stats[day].taskHours.push(taskDate.getHours())
    })

    return { data: stats, error: null }
  }

  async getYearStats(year) {
    const userId = await this.getUserId()
    if (!userId) return { data: [], error: 'User not authenticated' }

    const startDate = new Date(year, 0, 1).toISOString().split('T')[0]
    const endDate = new Date(year, 11, 31).toISOString().split('T')[0]

    const { data, error } = await this.supabase
      .from('tasks')
      .select('start_date, completed')
      .eq('user_id', userId)
      .gte('start_date', startDate)
      .lte('start_date', endDate)

    if (error) {
      console.error('Error fetching year stats:', error)
      return { data: [], error }
    }

    const stats = Array(12).fill(null).map(() => ({
      totalTasks: 0,
      completedTasks: 0,
      completedDays: []
    }))

    data.forEach(task => {
      const monthIndex = new Date(task.start_date).getMonth()
      const day = new Date(task.start_date).getDate()
      
      stats[monthIndex].totalTasks++
      if (task.completed) {
        stats[monthIndex].completedTasks++
        if (!stats[monthIndex].completedDays.includes(day)) {
          stats[monthIndex].completedDays.push(day)
        }
      }
    })

    return { data: stats, error: null }
  }

  async toggleTaskCompletion(taskId) {
    const userId = await this.getUserId()
    if (!userId) return { data: null, error: 'User not authenticated' }

    const { data: currentTask } = await this.supabase
      .from('tasks')
      .select('completed')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (!currentTask) {
      return { data: null, error: 'Task not found' }
    }

    const { data, error } = await this.supabase
      .from('tasks')
      .update({ completed: !currentTask.completed })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single()

    return { data, error }
  }

  async createTask(taskData) {
    const userId = await this.getUserId()
    if (!userId) return { data: null, error: 'User not authenticated' }

    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        user_id: userId,
        ...taskData
      })
      .select()
      .single()

    return { data, error }
  }

  async updateTask(taskId, taskData) {
    const userId = await this.getUserId()
    if (!userId) return { data: null, error: 'User not authenticated' }

    const { data, error } = await this.supabase
      .from('tasks')
      .update(taskData)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single()

    return { data, error }
  }

  async deleteTask(taskId) {
    const userId = await this.getUserId()
    if (!userId) return { data: null, error: 'User not authenticated' }

    const { data, error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    return { data, error }
  }

  async getTaskCategories() {
    const userId = await this.getUserId()
    if (!userId) return { data: [], error: 'User not authenticated' }

    const { data, error } = await this.supabase
      .from('task_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    return { data, error }
  }

  async createTaskCategory(categoryData) {
    const userId = await this.getUserId()
    if (!userId) return { data: null, error: 'User not authenticated' }

    const { data, error } = await this.supabase
      .from('task_categories')
      .insert({
        user_id: userId,
        ...categoryData
      })
      .select()
      .single()

    return { data, error }
  }

  _timeToHours(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours + minutes / 60
  }

  _formatTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
}

export default new DatabaseService()