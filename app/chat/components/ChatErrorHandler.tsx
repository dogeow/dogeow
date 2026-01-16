'use client'

import type { ChatApiError } from '@/lib/api/chat-error-handler'

interface ChatErrorHandlerProps {
  storeError?: ChatApiError | null
  componentError?: ChatApiError | null
  retryLastAction: () => void
  clearError: () => void
  clearComponentError: () => void
  retryAction: (action: () => void) => void
  children: React.ReactNode
}

export default function ChatErrorHandler({ children }: ChatErrorHandlerProps) {
  return <>{children}</>
}
