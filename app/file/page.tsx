'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import FileExplorer from './components/FileExplorer'
import FileHeader from './components/FileHeader'
import { PageContainer } from '@/components/layout'

export default function FilePage() {
  return (
    <ProtectedRoute>
      <PageContainer>
        <FileHeader />

        <div className="mt-4">
          <FileExplorer />
        </div>
      </PageContainer>
    </ProtectedRoute>
  )
}
