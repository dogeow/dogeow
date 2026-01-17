import React, { memo } from 'react'

interface NoteErrorStateProps {
  message: string
  variant?: 'error' | 'warning'
}

export const NoteErrorState = memo<NoteErrorStateProps>(({ message, variant = 'error' }) => {
  const isError = variant === 'error'
  return (
    <div className="container mx-auto py-4">
      <div
        className={`rounded border px-4 py-3 ${
          isError
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
        }`}
      >
        {message}
      </div>
    </div>
  )
})

NoteErrorState.displayName = 'NoteErrorState'
