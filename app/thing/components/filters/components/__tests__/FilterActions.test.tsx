import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterActions } from '../FilterActions'

describe('FilterActions', () => {
  it('disables both buttons when no active filters', () => {
    render(<FilterActions hasActiveFilters={false} onClearAll={() => {}} onApply={() => {}} />)

    const resetButton = screen.getByRole('button', { name: '重置' })
    const applyButton = screen.getByRole('button', { name: '应用筛选' })

    expect(resetButton).toBeDisabled()
    expect(applyButton).toBeDisabled()
  })

  it('enables buttons and triggers callbacks when active filters exist', async () => {
    const user = userEvent.setup()
    const onClearAll = vi.fn()
    const onApply = vi.fn()

    render(<FilterActions hasActiveFilters={true} onClearAll={onClearAll} onApply={onApply} />)

    const resetButton = screen.getByRole('button', { name: '重置' })
    const applyButton = screen.getByRole('button', { name: '应用筛选' })

    expect(resetButton).toBeEnabled()
    expect(applyButton).toBeEnabled()

    await user.click(resetButton)
    await user.click(applyButton)

    expect(onClearAll).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledTimes(1)
  })
})
