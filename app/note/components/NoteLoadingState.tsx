import React, { memo } from 'react'
import { PageContainer } from '@/components/layout'

export const NoteLoadingState = memo(() => {
  return (
    <PageContainer>
      <div className="animate-pulse">
        <div className="mb-4 h-8 w-1/3 rounded bg-gray-200"></div>
        <div className="h-64 w-full rounded bg-gray-200"></div>
      </div>
    </PageContainer>
  )
})

NoteLoadingState.displayName = 'NoteLoadingState'
