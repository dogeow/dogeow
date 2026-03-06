'use client'

import ProtectedRoute from '@/components/ProtectedRoute'

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
