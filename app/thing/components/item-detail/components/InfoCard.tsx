import React, { memo } from 'react'

interface InfoCardProps {
  label: string
  value: string | number
  className?: string
}

export const InfoCard = memo<InfoCardProps>(({ label, value, className = '' }) => (
  <div className={`bg-background rounded-lg border p-3 shadow-sm ${className}`}>
    <h3 className="text-muted-foreground text-xs font-medium">{label}</h3>
    <p className="text-sm font-semibold">{value}</p>
  </div>
))

InfoCard.displayName = 'InfoCard'
