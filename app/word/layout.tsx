'use client'

import ProtectedRoute from '@/components/ProtectedRoute'

export default function WordLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
