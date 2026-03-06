'use client'

import type { ReactNode } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function GameLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
