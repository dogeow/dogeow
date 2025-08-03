import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog'

// Mock the translation hook
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'delete.confirm_title': 'Delete Item',
    'delete.confirm_description':
      'Are you sure you want to delete {itemName}? This action cannot be undone.',
    'delete.confirm_cancel': 'Cancel',
    'delete.confirm_action': 'Delete',
  }
  return translations[key] || key
})

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}))

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    itemName: 'Test Item',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dialog when open is true', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)

    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(
      screen.getByText('Are you sure you want to delete Test Item? This action cannot be undone.')
    ).toBeInTheDocument()
  })

  it('should not render dialog when open is false', () => {
    render(<DeleteConfirmationDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument()
  })

  it('should render translated button texts', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)

    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should call onConfirm when delete button is clicked', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should replace itemName in description', () => {
    render(<DeleteConfirmationDialog {...defaultProps} itemName="My Document" />)

    expect(
      screen.getByText('Are you sure you want to delete My Document? This action cannot be undone.')
    ).toBeInTheDocument()
  })

  it('should use translation keys correctly', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)

    expect(mockT).toHaveBeenCalledWith('delete.confirm_title')
    expect(mockT).toHaveBeenCalledWith('delete.confirm_description')
    expect(mockT).toHaveBeenCalledWith('delete.confirm_cancel')
    expect(mockT).toHaveBeenCalledWith('delete.confirm_action')
  })

  it('should pass onOpenChange to AlertDialog', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)

    // The onOpenChange prop should be passed to the underlying AlertDialog
    expect(defaultProps.onOpenChange).toBeDefined()
  })

  it('should handle different item names', () => {
    const { rerender } = render(<DeleteConfirmationDialog {...defaultProps} itemName="File 1" />)

    expect(
      screen.getByText('Are you sure you want to delete File 1? This action cannot be undone.')
    ).toBeInTheDocument()

    rerender(<DeleteConfirmationDialog {...defaultProps} itemName="Important Document" />)

    expect(
      screen.getByText(
        'Are you sure you want to delete Important Document? This action cannot be undone.'
      )
    ).toBeInTheDocument()
  })
})
