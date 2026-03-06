'use client'

import type { ReactNode } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function NavLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
