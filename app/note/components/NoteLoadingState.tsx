import React, { memo } from 'react'

export const NoteLoadingState = memo(() => {
  return (
    <div className="container mx-auto py-4">
      <div className="animate-pulse">
        <div className="mb-4 h-8 w-1/3 rounded bg-gray-200"></div>
        <div className="h-64 w-full rounded bg-gray-200"></div>
      </div>
    </div>
  )
})

NoteLoadingState.displayName = 'NoteLoadingState'
