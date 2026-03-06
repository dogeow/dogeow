'use client'

import ProtectedRoute from '@/components/ProtectedRoute'

export default function TodosLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
