'use client'

import ProtectedRoute from '@/components/ProtectedRoute'

export default function NavLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
