"use client"

import React from "react"
import ThingNavigation from "./components/ThingNavigation"

export default function ThingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <ThingNavigation />
      <div className="mx-2">
        {children}
      </div>
    </div>
  )
} 