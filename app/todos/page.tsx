'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Circle, GripVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/helpers'

const STORAGE_KEY = 'dogeow_todos'
const DEFAULT_LIST_NAME = '网站'
const DEFAULT_LIST_DESCRIPTION = '自己开发'

interface TodoTask {
  id: number
  todo_list_id: number
  title: string
  is_completed: boolean
  position: number
  created_at: string
  updated_at: string
}

interface TodoList {
  id: number
  user_id: number
  name: string
  description: string | null
  position: number
  created_at: string
  updated_at: string
  tasks: TodoTask[]
}

function loadFromStorage(): TodoList[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TodoList[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(lists: TodoList[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  } catch {
    toast.error('保存失败')
  }
}

let nextListId = 1
let nextTaskId = 1
function genListId(): number {
  return nextListId++
}
function genTaskId(): number {
  return nextTaskId++
}

function initIds(lists: TodoList[]): void {
  const maxListId = lists.reduce((m, l) => Math.max(m, l.id), 0)
  const maxTaskId = lists.reduce((m, l) => {
    const tMax = (l.tasks ?? []).reduce((t, task) => Math.max(t, task.id), 0)
    return Math.max(m, tMax)
  }, 0)
  nextListId = maxListId + 1
  nextTaskId = maxTaskId + 1
}

function createDefaultList(): TodoList {
  const now = new Date().toISOString()
  return {
    id: genListId(),
    user_id: 0,
    name: DEFAULT_LIST_NAME,
    description: DEFAULT_LIST_DESCRIPTION,
    position: 0,
    created_at: now,
    updated_at: now,
    tasks: [],
  }
}

function TodoItemRow({
  task,
  isCompleted,
  onToggle,
  onTitleBlur,
  isEditing,
  onStartEdit,
  editTitle,
  onEditTitleChange,
}: {
  task: TodoTask
  isCompleted: boolean
  onToggle: () => void
  onTitleBlur: () => void
  isEditing: boolean
  onStartEdit: () => void
  editTitle: string
  onEditTitleChange: (v: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg py-2.5 pr-2 transition-colors',
        isDragging && 'opacity-60 shadow-lg'
      )}
    >
      <button
        type="button"
        className="touch-none -ml-1 cursor-grab rounded p-1 text-muted-foreground outline-none hover:text-foreground active:cursor-grabbing"
        aria-label="拖动排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 rounded-full p-0.5 text-muted-foreground outline-none hover:text-foreground focus:ring-2 focus:ring-primary"
        aria-label={isCompleted ? '标记未完成' : '标记完成'}
      >
        {isCompleted ? (
          <Check className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5" strokeWidth={2} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={e => onEditTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={e => e.key === 'Enter' && onTitleBlur()}
            className="border-border w-full border-b bg-transparent py-0.5 text-sm focus:outline-none focus:ring-0"
            autoFocus
            aria-label="编辑任务"
          />
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className={cn(
              'w-full rounded py-0.5 text-left text-sm outline-none focus:ring-0',
              isCompleted && 'text-muted-foreground line-through'
            )}
          >
            {task.title || '未命名'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function TodosPage() {
  const [lists, setLists] = useState<TodoList[]>(() => {
    const loaded = loadFromStorage()
    initIds(loaded)
    return loaded.length > 0 ? loaded : [createDefaultList()]
  })
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const list = lists[0]
  const tasks = useMemo(() => list?.tasks ?? [], [list])

  useEffect(() => {
    if (lists.length > 0) saveToStorage(lists)
  }, [lists])

  const setList = useCallback((updater: (prev: TodoList) => TodoList) => {
    setLists(prev => {
      if (prev.length === 0) return prev
      return [updater(prev[0]), ...prev.slice(1)]
    })
  }, [])

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTaskTitle.trim()
    if (!title || !list) return
    const now = new Date().toISOString()
    const newTask: TodoTask = {
      id: genTaskId(),
      todo_list_id: list.id,
      title,
      is_completed: false,
      position: tasks.length,
      created_at: now,
      updated_at: now,
    }
    setList(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
      updated_at: now,
    }))
    setNewTaskTitle('')
    toast.success('已添加')
  }

  const handleToggle = useCallback(
    (task: TodoTask) => {
      const now = new Date().toISOString()
      setList(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === task.id ? { ...t, is_completed: !t.is_completed, updated_at: now } : t
        ),
        updated_at: now,
      }))
    },
    [setList]
  )

  const handleTitleChange = useCallback(
    (task: TodoTask, title: string) => {
      if (title === task.title) {
        setEditingTaskId(null)
        return
      }
      const now = new Date().toISOString()
      setList(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === task.id ? { ...t, title: title.trim() || t.title, updated_at: now } : t
        ),
        updated_at: now,
      }))
      setEditingTaskId(null)
    },
    [setList]
  )

  const handleEndEdit = useCallback(() => {
    if (editingTaskId == null) return
    const task = tasks.find(t => t.id === editingTaskId)
    if (task && editTitle.trim() !== task.title) handleTitleChange(task, editTitle.trim())
    setEditingTaskId(null)
  }, [editingTaskId, editTitle, tasks, handleTitleChange])

  const handleStartEdit = useCallback((task: TodoTask) => {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
  }, [])

  const handleReorder = useCallback(
    (taskIds: number[]) => {
      setList(prev => {
        const idToTask = new Map(prev.tasks.map(t => [t.id, t]))
        const ordered = taskIds
          .map((id, position) => {
            const t = idToTask.get(id)
            return t ? { ...t, position } : null
          })
          .filter(Boolean) as TodoTask[]
        return { ...prev, tasks: ordered }
      })
    },
    [setList]
  )

  const handleDeleteList = useCallback(() => {
    setLists([createDefaultList()])
    setEditingTaskId(null)
    setEditTitle('')
    setNewTaskTitle('')
    setDeleteDialogOpen(false)
    toast.success('已删除列表')
  }, [])

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)
  const taskIds = sortedTasks.map(t => t.id)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortedTasks.findIndex(t => t.id === active.id)
    const newIndex = sortedTasks.findIndex(t => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    handleReorder(arrayMove(sortedTasks, oldIndex, newIndex).map(t => t.id))
  }

  if (!list) {
    return (
      <PageContainer maxWidth="2xl">
        <div className="text-muted-foreground flex items-center justify-center py-12">加载中…</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={list.name}
        description={list.description ?? undefined}
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            aria-label="删除列表"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        }
      />

      <section className="border-border mb-6 border-b pb-4">
        <p className="text-muted-foreground mb-2 text-sm">我</p>
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="任务"
            aria-label="新任务"
            className="border-border bg-background focus:ring-primary flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
          <Button type="submit" size="sm">
            添加
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-base font-medium">代办事项</h2>
        {sortedTasks.length === 0 ? (
          <p className="text-muted-foreground py-6 text-sm">暂无事项，在上方添加一条吧</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              <ul className="divide-border divide-y" role="list">
                {sortedTasks.map(task => (
                  <li key={task.id} role="listitem">
                    <TodoItemRow
                      task={task}
                      isCompleted={task.is_completed}
                      onToggle={() => handleToggle(task)}
                      onTitleBlur={handleEndEdit}
                      isEditing={editingTaskId === task.id}
                      onStartEdit={() => handleStartEdit(task)}
                      editTitle={editingTaskId === task.id ? editTitle : ''}
                      onEditTitleChange={setEditTitle}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`删除「${list.name}」列表？`}
        description="删除后，该列表下的所有任务也将一并删除。"
        confirmText="删除"
        onConfirm={handleDeleteList}
      />
    </PageContainer>
  )
}
