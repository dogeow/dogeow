import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type MouseEvent,
  type ReactNode,
} from 'react'

interface PopoverMockOptions {
  contentTestId?: string
  respectOpen?: boolean
  rootTestId?: string
}

export const createPopoverMock = ({
  contentTestId = 'popover-content',
  respectOpen = false,
  rootTestId,
}: PopoverMockOptions = {}) => {
  const PopoverContext = createContext<{
    isOpen: boolean
    onOpenChange?: (open: boolean) => void
  }>({
    isOpen: true,
  })

  return {
    Popover: ({
      children,
      onOpenChange,
      open,
    }: {
      children: ReactNode
      onOpenChange?: (open: boolean) => void
      open?: boolean
    }) => {
      const isOpen = respectOpen ? (open ?? true) : true
      const content = rootTestId ? (
        <div data-testid={rootTestId}>{children}</div>
      ) : (
        <div>{children}</div>
      )

      return (
        <PopoverContext.Provider value={{ isOpen, onOpenChange }}>
          {content}
        </PopoverContext.Provider>
      )
    },
    PopoverTrigger: ({ children }: { children: ReactNode }) => {
      const { isOpen, onOpenChange } = useContext(PopoverContext)

      if (!isValidElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>(children)) {
        return <>{children}</>
      }

      return cloneElement(children, {
        onClick: event => {
          children.props.onClick?.(event)
          onOpenChange?.(!isOpen)
        },
      })
    },
    PopoverContent: ({ children }: { children: ReactNode }) => {
      const { isOpen } = useContext(PopoverContext)

      if (!isOpen) return null

      return <div data-testid={contentTestId}>{children}</div>
    },
  }
}

export const createInventoryItemDetailCardMock = (testId = 'detail-card') => ({
  InventoryItemDetailCard: ({
    item,
    footer,
  }: {
    item: { definition?: { name?: string } }
    footer?: ReactNode
  }) => (
    <div data-testid={testId}>
      <span>{item.definition?.name}</span>
      {footer}
    </div>
  ),
})

export const createItemSocketIndicatorsMock = (testId = 'socket-indicators') => ({
  ItemSocketIndicators: () => <span data-testid={testId} />,
})

export const createInventoryGameMock = () => ({
  ItemIcon: ({ item }: { item: { id: number } }) => <span>{`icon-${item.id}`}</span>,
  ItemTipIcon: ({ item }: { item: { id: number } }) => <span>{`tip-${item.id}`}</span>,
  FullComparePanel: ({
    actions = [],
    onAction,
  }: {
    actions?: string[]
    onAction?: (action: string) => void
  }) => (
    <div data-testid="compare-panel">
      {actions.map(action => (
        <button key={action} onClick={() => onAction?.(action)}>
          {`compare-${action}`}
        </button>
      ))}
    </div>
  ),
})

export const createEquipmentGameMock = () => ({
  ItemIcon: ({ item }: { item: { id: number } }) => <span>{`icon-${item.id}`}</span>,
})

export const createGameItemSlotMock = (testId = 'game-item-slot') => ({
  GameItemSlot: ({
    emptyLabel,
    item,
    onClick,
    title,
  }: {
    emptyLabel?: string
    item?: { definition?: { name?: string } } | null
    onClick: () => void
    title: string
  }) => (
    <div data-testid={testId}>
      <button type="button" onClick={onClick} disabled={!item}>
        {item?.definition?.name ?? emptyLabel ?? title}
      </button>
    </div>
  ),
})
