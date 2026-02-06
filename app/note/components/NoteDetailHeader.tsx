import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, ArrowLeft, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NoteDetailHeaderProps {
  title: string
  isDraft: boolean
  noteId: string | string[] | undefined
  onDelete: () => void
}

export const NoteDetailHeader = memo<NoteDetailHeaderProps>(
  ({ title, isDraft, noteId, onDelete }) => {
    const router = useRouter()

    return (
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex flex-1 items-center justify-center truncate text-center text-2xl font-bold tracking-tight">
          {title}
          {isDraft && <Lock className="text-muted-foreground ml-2 h-4 w-4" />}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const id = Array.isArray(noteId) ? noteId[0] : noteId
              router.push(`/note/edit/${id}`)
            }}
          >
            <Edit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="text-destructive h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }
)

NoteDetailHeader.displayName = 'NoteDetailHeader'
