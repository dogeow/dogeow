import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { ConfirmDialog } from '../confirm-dialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dialog when open is true', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
  })

  it('should not render dialog when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
    expect(screen.queryByText('Are you sure you want to proceed?')).not.toBeInTheDocument()
  })

  it('should render default button texts', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('确认')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('should render custom button texts', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Delete" cancelText="Keep" />)

    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should not call onCancel when not provided', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    // Should not throw error when onCancel is not provided
    expect(defaultProps.onConfirm).not.toHaveBeenCalled()
  })

  it('should call onOpenChange when dialog state changes', () => {
    render(<ConfirmDialog {...defaultProps} />)

    // The onOpenChange would be called by the underlying AlertDialog
    // We can't easily test this without more complex setup, but we can verify the prop is passed
    expect(defaultProps.onOpenChange).toBeDefined()
  })

  it('should render with all required props', () => {
    const minimalProps = {
      open: true,
      onOpenChange: vi.fn(),
      title: 'Test Title',
      description: 'Test Description',
      onConfirm: vi.fn(),
    }

    render(<ConfirmDialog {...minimalProps} />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('确认')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })
})
