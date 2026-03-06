'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import ThingNavigation from './components/ThingNavigation'

export default function ThingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-2">
        <ThingNavigation />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  )
}
