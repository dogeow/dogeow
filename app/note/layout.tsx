"use client"

import NoteNavigation from "./components/NoteNavigation"
import "./styles/prism.css"

export default function NoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full gap-2">
      <NoteNavigation />
      <div className="mx-2">
        {children}
      </div>
    </div>
  )
} 