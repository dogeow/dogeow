export interface TodoTask {
  id: number
  todo_list_id: number
  title: string
  is_completed: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface TodoList {
  id: number
  user_id: number
  name: string
  description: string | null
  position: number
  created_at: string
  updated_at: string
  tasks?: TodoTask[]
}
