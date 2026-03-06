import { get, post, put, patch, del } from '@/lib/api'
import type { TodoList, TodoTask } from './types'

export function fetchTodoLists(): Promise<TodoList[]> {
  return get<TodoList[]>('/todos')
}

export function fetchTodoList(id: string): Promise<TodoList> {
  return get<TodoList>(`/todos/${id}`)
}

export function createTodoList(payload: { name: string; description?: string }): Promise<TodoList> {
  return post<TodoList>('/todos', payload)
}

export function updateTodoList(
  id: string,
  payload: { name?: string; description?: string }
): Promise<TodoList> {
  return put<TodoList>(`/todos/${id}`, payload)
}

export function deleteTodoList(id: string): Promise<void> {
  return del(`/todos/${id}`)
}

export function createTodoTask(listId: string, title: string): Promise<TodoTask> {
  return post<TodoTask>(`/todos/${listId}/tasks`, { title })
}

export function updateTodoTask(
  listId: string,
  taskId: number,
  payload: { title?: string; is_completed?: boolean; position?: number }
): Promise<TodoTask> {
  return patch<TodoTask>(`/todos/${listId}/tasks/${taskId}`, payload)
}

export function deleteTodoTask(listId: string, taskId: number): Promise<void> {
  return del(`/todos/${listId}/tasks/${taskId}`)
}

export function reorderTodoTasks(listId: string, taskIds: number[]): Promise<TodoList> {
  return put<TodoList>(`/todos/${listId}/tasks/reorder`, { task_ids: taskIds })
}
