"use client"

import ThingNavigation from "./components/ThingNavigation"

export default function ThingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full gap-2">
      <ThingNavigation />
      <div className="mx-2">
        {children}
      </div>
    </div>
  )
} 