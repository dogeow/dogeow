import type { CSSProperties } from 'react'

export default function RpgHostLayout({ children }: { children: React.ReactNode }) {
  const hostLayoutStyle = { '--app-header-height': '0px' } as CSSProperties

  return (
    <div className="min-h-screen" style={hostLayoutStyle}>
      {children}
    </div>
  )
}
