'use client'

import type { ReactNode } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function WordLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
