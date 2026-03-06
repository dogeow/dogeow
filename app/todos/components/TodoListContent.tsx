'use client'

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
import { Check, GripVertical, Circle } from 'lucide-react'
import { cn } from '@/lib/helpers'
import type { TodoTask } from '../types'

interface TodoItemProps {
  task: TodoTask
  isCompleted: boolean
  onToggle: () => void
  onTitleChange: (title: string) => void
  onTitleBlur: () => void
  isEditing: boolean
  onStartEdit: () => void
  editTitle: string
  onEditTitleChange: (v: string) => void
}

function TodoItemInner({
  task,
  isCompleted,
  onToggle,
  onTitleChange,
  onTitleBlur,
  isEditing,
  onStartEdit,
  editTitle,
  onEditTitleChange,
}: TodoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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
        className="touch-none p-1 -ml-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground outline-none rounded"
        aria-label="拖动排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 p-0.5 rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            onKeyDown={e => {
              if (e.key === 'Enter') onTitleBlur()
            }}
            className="bg-transparent border-border w-full border-b py-0.5 text-sm focus:outline-none focus:ring-0"
            autoFocus
            aria-label="编辑任务"
          />
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className={cn(
              'text-left w-full py-0.5 text-sm focus:outline-none focus:ring-0 rounded',
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

export interface TodoListContentProps {
  tasks: TodoTask[]
  onReorder: (taskIds: number[]) => void
  onToggle: (task: TodoTask) => void
  onTitleChange: (task: TodoTask, title: string) => void
  editingTaskId: number | null
  onStartEdit: (task: TodoTask) => void
  onEndEdit: () => void
  editTitle: string
  onEditTitleChange: (v: string) => void
}

export function TodoListContent({
  tasks,
  onReorder,
  onToggle,
  onTitleChange,
  editingTaskId,
  onStartEdit,
  onEndEdit,
  editTitle,
  onEditTitleChange,
}: TodoListContentProps) {
  const taskIds = tasks.map(t => t.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex(t => t.id === active.id)
    const newIndex = tasks.findIndex(t => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(tasks, oldIndex, newIndex)
    onReorder(newOrder.map(t => t.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <ul className="divide-border divide-y" role="list">
          {tasks.map(task => (
            <li key={task.id} role="listitem">
              <TodoItemInner
                task={task}
                isCompleted={task.is_completed}
                onToggle={() => onToggle(task)}
                onTitleChange={title => onTitleChange(task, title)}
                onTitleBlur={() => onEndEdit()}
                isEditing={editingTaskId === task.id}
                onStartEdit={() => onStartEdit(task)}
                editTitle={editingTaskId === task.id ? editTitle : ''}
                onEditTitleChange={onEditTitleChange}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
