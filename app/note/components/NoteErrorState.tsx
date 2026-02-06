import React, { memo } from 'react'
import { PageContainer } from '@/components/layout'

interface NoteErrorStateProps {
  message: string
  variant?: 'error' | 'warning'
}

export const NoteErrorState = memo<NoteErrorStateProps>(({ message, variant = 'error' }) => {
  const isError = variant === 'error'
  return (
    <PageContainer>
      <div
        className={`rounded border px-4 py-3 ${
          isError
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
        }`}
      >
        {message}
      </div>
    </PageContainer>
  )
})

NoteErrorState.displayName = 'NoteErrorState'
