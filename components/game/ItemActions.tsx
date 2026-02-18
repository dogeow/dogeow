'use client'

export type ItemActionType =
  | 'equip'
  | 'use'
  | 'unequip'
  | 'store'
  | 'retrieve'
  | 'sell'
  | 'buy'
  | 'socket'
  | 'unsocket'

interface ItemActionsProps {
  actions: ItemActionType[]
  onAction: (action: ItemActionType) => void
  disabled?: boolean
}

const ACTION_LABELS: Record<ItemActionType, { label: string; color: string }> = {
  equip: { label: '装备', color: 'bg-green-600 hover:bg-green-700' },
  use: { label: '使用', color: 'bg-violet-600 hover:bg-violet-700' },
  unequip: { label: '卸下', color: 'bg-red-600 hover:bg-red-700' },
  store: { label: '存入', color: 'bg-blue-600 hover:bg-blue-700' },
  retrieve: { label: '取回', color: 'bg-blue-600 hover:bg-blue-700' },
  sell: { label: '出售', color: 'bg-red-600 hover:bg-red-700' },
  buy: { label: '确认购买', color: 'bg-green-600 hover:bg-green-700' },
  socket: { label: '镶嵌', color: 'bg-cyan-600 hover:bg-cyan-700' },
  unsocket: { label: '取下', color: 'bg-orange-600 hover:bg-orange-700' },
}

export function ItemActions({ actions, onAction, disabled = false }: ItemActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 border-t p-2.5">
      {actions.map(action => {
        const { label, color } = ACTION_LABELS[action]
        return (
          <button
            key={action}
            onClick={() => onAction(action)}
            disabled={disabled}
            className={`rounded px-3 py-1.5 text-xs text-white transition-colors disabled:opacity-50 ${color}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
