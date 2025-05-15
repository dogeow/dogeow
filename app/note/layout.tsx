"use client"

import NoteNavigation from "./components/NoteNavigation"
import "./styles/prism.css"

export default function NoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <NoteNavigation />
      <div className="flex-1 mx-2">
        {children}
      </div>
    </div>
  )
} 