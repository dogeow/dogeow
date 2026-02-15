'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Calendar, Lock } from 'lucide-react'
import type { Note } from '../types/note'
import { formatDate, getContentPreview } from '../utils/noteUtils'

interface NoteCardProps {
  note: Note
}

const NoteCard = memo(({ note }: NoteCardProps) => (
  <Link href={`/note/${note.id}`}>
    <Card className="hover:border-primary cursor-pointer transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="flex items-center text-base font-medium hover:underline">
            {note.title || '(无标题)'}
            {note.is_draft ? <Lock className="text-muted-foreground ml-2 h-4 w-4" /> : null}
          </h3>
        </div>

        <div className="text-muted-foreground mt-1 flex items-center text-sm">
          <Calendar className="mr-1 h-3 w-3" />
          <span>更新于 {formatDate(note.updated_at)}</span>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        <div className="text-muted-foreground prose prose-sm max-w-none text-sm">
          {note.content_markdown ? (
            <span>{getContentPreview(note.content_markdown)}</span>
          ) : (
            <span className="italic">(无内容)</span>
          )}
        </div>
      </CardContent>
    </Card>
  </Link>
))

NoteCard.displayName = 'NoteCard'

export default NoteCard
