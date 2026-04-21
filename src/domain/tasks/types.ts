export type TaskRecord = {
  id: string
  title: string
  startAt: string | null
  endAt: string | null
  notes: string
  completed: boolean
}

export type TaskFormInput = {
  title: string
  startAt: string | null
  endAt: string | null
  notes: string
  completed?: boolean
}
