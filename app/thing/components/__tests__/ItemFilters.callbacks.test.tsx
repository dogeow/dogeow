import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemFilters from '../ItemFilters'

const mockStoreState = vi.hoisted(() => ({
  categories: [
    { id: 1, name: '电子产品', parent_id: null },
    { id: 2, name: '手机', parent_id: 1 },
  ],
  savedFilters: {} as Record<string, unknown>,
}))

vi.mock('../../stores/itemStore', () => ({
  useItemStore: vi.fn(() => ({
    categories: mockStoreState.categories,
  })),
}))

vi.mock('../../stores/filterPersistenceStore', () => ({
  useFilterPersistenceStore: vi.fn(() => ({
    savedFilters: mockStoreState.savedFilters,
  })),
}))

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: unknown) => value,
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button type="button">{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('../filters/components/BasicFiltersTabContent', () => ({
  BasicFiltersTabContent: ({
    selectedCategory,
    onNameChange,
    onDescriptionChange,
    onStatusChange,
    onIsPublicChange,
    onTagsChange,
    onCategorySelect,
  }: any) => (
    <div>
      <div data-testid="selected-category">
        {selectedCategory ? `${selectedCategory.type}:${selectedCategory.id}` : 'none'}
      </div>
      <button type="button" onClick={() => onNameChange('测试名称')}>
        basic-name
      </button>
      <button type="button" onClick={() => onDescriptionChange('测试描述')}>
        basic-description
      </button>
      <button type="button" onClick={() => onStatusChange('active')}>
        basic-status
      </button>
      <button type="button" onClick={() => onIsPublicChange(true)}>
        basic-public
      </button>
      <button type="button" onClick={() => onTagsChange(['1', '2'])}>
        basic-tags
      </button>
      <button type="button" onClick={() => onCategorySelect('child', 2)}>
        basic-category-child
      </button>
      <button type="button" onClick={() => onCategorySelect('parent', null)}>
        basic-category-clear
      </button>
    </div>
  ),
}))

vi.mock('../filters/components/DetailedFiltersTab', () => ({
  DetailedFiltersTab: ({
    onPurchaseDateFromChange,
    onPurchaseDateToChange,
    onIncludeNullPurchaseDateChange,
    onExpiryDateFromChange,
    onExpiryDateToChange,
    onIncludeNullExpiryDateChange,
    onPriceFromChange,
    onPriceToChange,
    onAreaIdChange,
    onRoomIdChange,
    onSpotIdChange,
  }: any) => (
    <div>
      <button type="button" onClick={() => onPurchaseDateFromChange(new Date('2025-01-01'))}>
        detailed-purchase-from
      </button>
      <button type="button" onClick={() => onPurchaseDateToChange(undefined)}>
        detailed-purchase-to
      </button>
      <button type="button" onClick={() => onIncludeNullPurchaseDateChange(true)}>
        detailed-purchase-null
      </button>
      <button type="button" onClick={() => onExpiryDateFromChange(new Date('2025-12-31'))}>
        detailed-expiry-from
      </button>
      <button type="button" onClick={() => onExpiryDateToChange(undefined)}>
        detailed-expiry-to
      </button>
      <button type="button" onClick={() => onIncludeNullExpiryDateChange(true)}>
        detailed-expiry-null
      </button>
      <button type="button" onClick={() => onPriceFromChange('100')}>
        detailed-price-from
      </button>
      <button type="button" onClick={() => onPriceToChange('999')}>
        detailed-price-to
      </button>
      <button type="button" onClick={() => onAreaIdChange('1')}>
        detailed-area
      </button>
      <button type="button" onClick={() => onRoomIdChange('2')}>
        detailed-room
      </button>
      <button type="button" onClick={() => onSpotIdChange('3')}>
        detailed-spot
      </button>
    </div>
  ),
}))

vi.mock('../filters/components/FilterActions', () => ({
  FilterActions: ({ hasActiveFilters, onClearAll, onApply }: any) => (
    <div>
      <div data-testid="has-active">{String(hasActiveFilters)}</div>
      <button type="button" onClick={onClearAll}>
        clear-all
      </button>
      <button type="button" onClick={onApply}>
        apply-filters
      </button>
    </div>
  ),
}))

describe('ItemFilters callbacks', () => {
  const mockOnApply = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.savedFilters = {}
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should update filters from basic and detailed callback props then apply', async () => {
    const user = userEvent.setup()

    render(
      <ItemFilters
        onApply={mockOnApply}
        categories={[]}
        areas={undefined as any}
        rooms={undefined as any}
        spots={undefined as any}
        tags={undefined as any}
      />
    )

    await user.click(screen.getByRole('button', { name: 'basic-name' }))
    await user.click(screen.getByRole('button', { name: 'basic-description' }))
    await user.click(screen.getByRole('button', { name: 'basic-status' }))
    await user.click(screen.getByRole('button', { name: 'basic-public' }))
    await user.click(screen.getByRole('button', { name: 'basic-tags' }))
    await user.click(screen.getByRole('button', { name: 'basic-category-child' }))
    await user.click(screen.getByRole('button', { name: 'detailed-purchase-from' }))
    await user.click(screen.getByRole('button', { name: 'detailed-purchase-to' }))
    await user.click(screen.getByRole('button', { name: 'detailed-purchase-null' }))
    await user.click(screen.getByRole('button', { name: 'detailed-expiry-from' }))
    await user.click(screen.getByRole('button', { name: 'detailed-expiry-to' }))
    await user.click(screen.getByRole('button', { name: 'detailed-expiry-null' }))
    await user.click(screen.getByRole('button', { name: 'detailed-price-from' }))
    await user.click(screen.getByRole('button', { name: 'detailed-price-to' }))
    await user.click(screen.getByRole('button', { name: 'detailed-area' }))
    await user.click(screen.getByRole('button', { name: 'detailed-room' }))
    await user.click(screen.getByRole('button', { name: 'detailed-spot' }))
    await user.click(screen.getByRole('button', { name: 'apply-filters' }))

    expect(mockOnApply).toHaveBeenCalled()
    expect(screen.getByTestId('has-active')).toHaveTextContent('true')
  })

  it('should initialize category from saved filters and apply after clear all timeout', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockStoreState.savedFilters = { category_id: '2' }

    render(
      <ItemFilters
        onApply={mockOnApply}
        categories={[]}
        areas={[]}
        rooms={[]}
        spots={[]}
        tags={[]}
      />
    )

    expect(screen.getByTestId('selected-category')).toHaveTextContent('child:2')

    await user.click(screen.getByRole('button', { name: 'clear-all' }))
    vi.advanceTimersByTime(120)

    expect(mockOnApply).toHaveBeenCalled()
  })
})
