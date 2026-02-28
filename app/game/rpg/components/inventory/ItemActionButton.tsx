'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ItemActionVariant = 'equip' | 'move' | 'sell' | 'socket' | 'unequip' | 'unsocket' | 'use'

const VARIANT_STYLES: Record<ItemActionVariant, string> = {
  use: 'bg-violet-600 hover:bg-violet-700',
  equip: 'bg-green-600 hover:bg-green-700',
  move: 'bg-blue-600 hover:bg-blue-700',
  sell: 'bg-red-600 hover:bg-red-700',
  socket: 'bg-cyan-600 hover:bg-cyan-700',
  unequip: 'bg-red-600 hover:bg-red-700',
  unsocket: 'bg-orange-600 hover:bg-orange-700',
}

interface ItemActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant: ItemActionVariant
}

export function ItemActionButton({
  children,
  className = '',
  variant,
  ...props
}: ItemActionButtonProps) {
  return (
    <button
      {...props}
      className={`rounded px-3 py-1.5 text-xs text-white disabled:opacity-50 ${VARIANT_STYLES[variant]} ${className}`.trim()}
    >
      {children}
    </button>
  )
}
