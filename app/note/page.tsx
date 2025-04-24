"use client"

import dynamic from 'next/dynamic'

// 使用动态导入，避免SSR时的错误
const NoteList = dynamic(
  () => import('@/app/note/components/NoteList'), 
  { ssr: false }
)

export default function NotePage() {
  return (
    <div className="container mx-auto py-4">
      <NoteList />
    </div>
  )
}