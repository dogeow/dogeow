import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DetailedFiltersTab } from '../filters/components/DetailedFiltersTab'
import { initialFilters } from '../filters/types'

vi.mock('../filters/DateRangePicker', () => ({
  DateRangePicker: ({ label, onFromDateChange, onToDateChange, onIncludeNullChange }: any) => (
    <div>
      <span>{label}</span>
      <button type="button" onClick={() => onFromDateChange(new Date('2025-01-01'))}>
        {label}-from
      </button>
      <button type="button" onClick={() => onToDateChange(undefined)}>
        {label}-to
      </button>
      <button type="button" onClick={() => onIncludeNullChange(true)}>
        {label}-null
      </button>
    </div>
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div data-testid={`select-${String(value)}`}>
      <button
        type="button"
        aria-label={`pick-${String(value)}-1`}
        onClick={() => onValueChange?.('1')}
      />
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}))

describe('DetailedFiltersTab', () => {
  it('should handle date/price/select callbacks and filter room/spot options', async () => {
    const user = userEvent.setup()
    const onPurchaseDateFromChange = vi.fn()
    const onPurchaseDateToChange = vi.fn()
    const onIncludeNullPurchaseDateChange = vi.fn()
    const onExpiryDateFromChange = vi.fn()
    const onExpiryDateToChange = vi.fn()
    const onIncludeNullExpiryDateChange = vi.fn()
    const onPriceFromChange = vi.fn()
    const onPriceToChange = vi.fn()
    const onAreaIdChange = vi.fn()
    const onRoomIdChange = vi.fn()
    const onSpotIdChange = vi.fn()

    render(
      <DetailedFiltersTab
        filters={{ ...initialFilters, area_id: '1', room_id: '11', spot_id: '111' }}
        areas={[
          { id: 1, name: '客厅' },
          { id: 2, name: '卧室' },
        ]}
        rooms={[
          { id: 11, name: '客厅房间', area_id: 1 },
          { id: 22, name: '卧室房间', area_id: 2 },
        ]}
        spots={[
          { id: 111, name: '客厅位置', room_id: 11 },
          { id: 222, name: '卧室位置', room_id: 22 },
        ]}
        onPurchaseDateFromChange={onPurchaseDateFromChange}
        onPurchaseDateToChange={onPurchaseDateToChange}
        onIncludeNullPurchaseDateChange={onIncludeNullPurchaseDateChange}
        onExpiryDateFromChange={onExpiryDateFromChange}
        onExpiryDateToChange={onExpiryDateToChange}
        onIncludeNullExpiryDateChange={onIncludeNullExpiryDateChange}
        onPriceFromChange={onPriceFromChange}
        onPriceToChange={onPriceToChange}
        onAreaIdChange={onAreaIdChange}
        onRoomIdChange={onRoomIdChange}
        onSpotIdChange={onSpotIdChange}
      />
    )

    await user.click(screen.getByRole('button', { name: '购买日期-from' }))
    await user.click(screen.getByRole('button', { name: '购买日期-to' }))
    await user.click(screen.getByRole('button', { name: '购买日期-null' }))
    await user.click(screen.getByRole('button', { name: '过期日期-from' }))
    await user.click(screen.getByRole('button', { name: '过期日期-to' }))
    await user.click(screen.getByRole('button', { name: '过期日期-null' }))
    expect(onPurchaseDateFromChange).toHaveBeenCalled()
    expect(onPurchaseDateToChange).toHaveBeenCalledWith(undefined)
    expect(onIncludeNullPurchaseDateChange).toHaveBeenCalledWith(true)
    expect(onExpiryDateFromChange).toHaveBeenCalled()
    expect(onExpiryDateToChange).toHaveBeenCalledWith(undefined)
    expect(onIncludeNullExpiryDateChange).toHaveBeenCalledWith(true)

    const priceInputs = screen.getAllByRole('spinbutton')
    await user.type(priceInputs[0], '10')
    await user.type(priceInputs[1], '20')
    expect(onPriceFromChange).toHaveBeenCalled()
    expect(onPriceToChange).toHaveBeenCalled()

    await user.click(screen.getByLabelText('pick-1-1'))
    await user.click(screen.getByLabelText('pick-11-1'))
    await user.click(screen.getByLabelText('pick-111-1'))
    expect(onAreaIdChange).toHaveBeenCalledWith('1')
    expect(onRoomIdChange).toHaveBeenCalledWith('1')
    expect(onSpotIdChange).toHaveBeenCalledWith('1')

    expect(screen.getByText('客厅房间')).toBeInTheDocument()
    expect(screen.queryByText('卧室房间')).not.toBeInTheDocument()
    expect(screen.getByText('客厅位置')).toBeInTheDocument()
    expect(screen.queryByText('卧室位置')).not.toBeInTheDocument()
  })
})
