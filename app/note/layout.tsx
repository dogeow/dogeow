"use client"

import NoteNavigation from "./components/NoteNavigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import "./styles/prism.css"

export default function NoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-[calc(100vh-50px)]">
        <NoteNavigation />
        <div className="flex-1 px-4">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  )
} 