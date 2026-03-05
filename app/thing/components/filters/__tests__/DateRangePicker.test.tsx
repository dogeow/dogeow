import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { DateRangePicker } from '../DateRangePicker'

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (date: Date | undefined) => void }) => (
    <button type="button" onClick={() => onSelect(new Date(2026, 2, 5))}>
      pick-date
    </button>
  ),
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    id: string
  }) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
    />
  ),
}))

describe('DateRangePicker', () => {
  it('renders placeholders when dates are empty and triggers callbacks', async () => {
    const user = userEvent.setup()
    const onFromDateChange = vi.fn()
    const onToDateChange = vi.fn()
    const onIncludeNullChange = vi.fn()

    render(
      <DateRangePicker
        label="购买日期"
        fromDate={null}
        toDate={null}
        includeNull={false}
        onFromDateChange={onFromDateChange}
        onToDateChange={onToDateChange}
        onIncludeNullChange={onIncludeNullChange}
      />
    )

    expect(screen.getByText('开始日期')).toBeInTheDocument()
    expect(screen.getByText('结束日期')).toBeInTheDocument()
    expect(screen.getByText('包含空日期的物品')).toBeInTheDocument()

    const calendarButtons = screen.getAllByRole('button', { name: 'pick-date' })
    await user.click(calendarButtons[0])
    await user.click(calendarButtons[1])
    expect(onFromDateChange).toHaveBeenCalledTimes(1)
    expect(onToDateChange).toHaveBeenCalledTimes(1)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    expect(onIncludeNullChange).toHaveBeenCalledWith(true)
  })

  it('renders formatted date when dates are provided and switch is checked', () => {
    render(
      <DateRangePicker
        label="过期日期"
        fromDate={new Date(2026, 0, 2)}
        toDate={new Date(2026, 0, 31)}
        includeNull={true}
        onFromDateChange={vi.fn()}
        onToDateChange={vi.fn()}
        onIncludeNullChange={vi.fn()}
      />
    )

    expect(screen.getByText('2026-01-02')).toBeInTheDocument()
    expect(screen.getByText('2026-01-31')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
