'use client'

import FileExplorer from './components/FileExplorer'
import FileHeader from './components/FileHeader'

export default function FilePage() {
  return (
    <div className="container mx-auto p-4">
      <FileHeader />

      <div className="mt-4">
        <FileExplorer />
      </div>
    </div>
  )
}
