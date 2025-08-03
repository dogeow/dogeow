import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogOverlay,
} from '../dialog'

// Mock Radix UI Dialog
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => {
    const handleClick = () => {
      if (onOpenChange) onOpenChange(!open)
    }
    return (
      <div data-testid="dialog-root" data-open={open} onClick={handleClick}>
        {children}
      </div>
    )
  },
  Trigger: ({
    children,
    asChild,
    onClick,
  }: {
    children: React.ReactNode
    asChild?: boolean
    onClick?: (e: React.MouseEvent) => void
  }) => {
    const handleClick = (e: React.MouseEvent) => {
      if (onClick) onClick(e)
    }
    return (
      <button data-testid="dialog-trigger" data-as-child={asChild} onClick={handleClick}>
        {children}
      </button>
    )
  },
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-portal">{children}</div>
  ),
  Overlay: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div data-testid="dialog-overlay" className={className} {...props} />
  ),
  Content: ({
    className,
    children,
    ...props
  }: {
    className?: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <div data-testid="dialog-content" className={className} {...props}>
      {children}
    </div>
  ),
  Title: ({
    className,
    children,
    ...props
  }: {
    className?: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <h2 data-testid="dialog-title" className={className} {...props}>
      {children}
    </h2>
  ),
  Description: ({
    className,
    children,
    ...props
  }: {
    className?: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <p data-testid="dialog-description" className={className} {...props}>
      {children}
    </p>
  ),
  Close: ({
    className,
    children,
    onClick,
    ...props
  }: {
    className?: string
    children: React.ReactNode
    onClick?: (e: React.MouseEvent) => void
    [key: string]: unknown
  }) => {
    const handleClick = (e: React.MouseEvent) => {
      if (onClick) onClick(e)
    }
    return (
      <button data-testid="dialog-close" className={className} onClick={handleClick} {...props}>
        {children}
      </button>
    )
  },
}))

describe('Dialog', () => {
  it('should render dialog root', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
  })

  it('should handle open state', () => {
    render(
      <Dialog open={true}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    const root = screen.getByTestId('dialog-root')
    expect(root).toHaveAttribute('data-open', 'true')
  })

  it('should handle onOpenChange callback', () => {
    const handleOpenChange = vi.fn()
    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    const root = screen.getByTestId('dialog-root')
    fireEvent.click(root)
    expect(handleOpenChange).toHaveBeenCalled()
  })
})

describe('DialogTrigger', () => {
  it('should render trigger button', () => {
    render(<DialogTrigger>Open Dialog</DialogTrigger>)

    const trigger = screen.getByTestId('dialog-trigger')
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent('Open Dialog')
  })

  it('should handle asChild prop', () => {
    render(
      <DialogTrigger asChild>
        <a href="/test">Link Trigger</a>
      </DialogTrigger>
    )

    const trigger = screen.getByTestId('dialog-trigger')
    expect(trigger).toHaveAttribute('data-as-child', 'true')
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    render(<DialogTrigger onClick={handleClick}>Click Me</DialogTrigger>)

    const trigger = screen.getByTestId('dialog-trigger')
    await userEvent.click(trigger)
    expect(handleClick).toHaveBeenCalled()
  })
})

describe('DialogContent', () => {
  it('should render content with portal and overlay', () => {
    render(
      <DialogContent>
        <DialogTitle>Test Title</DialogTitle>
        <DialogDescription>Test Description</DialogDescription>
      </DialogContent>
    )

    expect(screen.getByTestId('dialog-portal')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <DialogContent className="custom-class">
        <DialogTitle>Title</DialogTitle>
      </DialogContent>
    )

    const content = screen.getByTestId('dialog-content')
    expect(content).toHaveClass('custom-class')
  })

  it('should render children correctly', () => {
    render(
      <DialogContent>
        <div data-testid="custom-child">Custom Content</div>
      </DialogContent>
    )

    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    expect(screen.getByText('Custom Content')).toBeInTheDocument()
  })

  it('should render close button', () => {
    render(
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
      </DialogContent>
    )

    const closeButton = screen.getByTestId('dialog-close')
    expect(closeButton).toBeInTheDocument()
  })
})

describe('DialogHeader', () => {
  it('should render header with correct classes', () => {
    render(
      <DialogHeader>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
      </DialogHeader>
    )

    const header = screen.getByTestId('dialog-title').parentElement
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'text-center', 'sm:text-left')
  })

  it('should apply custom className', () => {
    render(
      <DialogHeader className="custom-header">
        <DialogTitle>Title</DialogTitle>
      </DialogHeader>
    )

    const header = screen.getByTestId('dialog-title').parentElement
    expect(header).toHaveClass('custom-header')
  })

  it('should render children correctly', () => {
    render(
      <DialogHeader>
        <DialogTitle>Test Title</DialogTitle>
        <DialogDescription>Test Description</DialogDescription>
      </DialogHeader>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })
})

describe('DialogFooter', () => {
  it('should render footer with correct classes', () => {
    render(
      <DialogFooter>
        <button>Cancel</button>
        <button>Confirm</button>
      </DialogFooter>
    )

    const footer = screen.getByText('Cancel').parentElement
    expect(footer).toHaveClass(
      'flex',
      'flex-col-reverse',
      'sm:flex-row',
      'sm:justify-end',
      'sm:space-x-2'
    )
  })

  it('should apply custom className', () => {
    render(
      <DialogFooter className="custom-footer">
        <button>Action</button>
      </DialogFooter>
    )

    const footer = screen.getByText('Action').parentElement
    expect(footer).toHaveClass('custom-footer')
  })

  it('should render children correctly', () => {
    render(
      <DialogFooter>
        <button data-testid="cancel-btn">Cancel</button>
        <button data-testid="confirm-btn">Confirm</button>
      </DialogFooter>
    )

    expect(screen.getByTestId('cancel-btn')).toBeInTheDocument()
    expect(screen.getByTestId('confirm-btn')).toBeInTheDocument()
  })
})

describe('DialogTitle', () => {
  it('should render title with correct classes', () => {
    render(<DialogTitle>Test Title</DialogTitle>)

    const title = screen.getByTestId('dialog-title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('text-lg', 'leading-none', 'font-semibold', 'tracking-tight')
  })

  it('should apply custom className', () => {
    render(<DialogTitle className="custom-title">Title</DialogTitle>)

    const title = screen.getByTestId('dialog-title')
    expect(title).toHaveClass('custom-title')
  })

  it('should render children correctly', () => {
    render(<DialogTitle>Test Dialog Title</DialogTitle>)

    expect(screen.getByText('Test Dialog Title')).toBeInTheDocument()
  })

  it('should handle ref', () => {
    const ref = vi.fn()
    render(<DialogTitle ref={ref}>Title</DialogTitle>)

    expect(ref).toHaveBeenCalled()
  })
})

describe('DialogDescription', () => {
  it('should render description with correct classes', () => {
    render(<DialogDescription>Test Description</DialogDescription>)

    const description = screen.getByTestId('dialog-description')
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('text-muted-foreground', 'text-sm')
  })

  it('should apply custom className', () => {
    render(<DialogDescription className="custom-description">Description</DialogDescription>)

    const description = screen.getByTestId('dialog-description')
    expect(description).toHaveClass('custom-description')
  })

  it('should render children correctly', () => {
    render(<DialogDescription>Test Dialog Description</DialogDescription>)

    expect(screen.getByText('Test Dialog Description')).toBeInTheDocument()
  })

  it('should handle ref', () => {
    const ref = vi.fn()
    render(<DialogDescription ref={ref}>Description</DialogDescription>)

    expect(ref).toHaveBeenCalled()
  })
})

describe('DialogClose', () => {
  it('should render close button', () => {
    render(<DialogClose>Close</DialogClose>)

    const closeButton = screen.getByTestId('dialog-close')
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveTextContent('Close')
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    render(<DialogClose onClick={handleClick}>Close</DialogClose>)

    const closeButton = screen.getByTestId('dialog-close')
    await userEvent.click(closeButton)
    expect(handleClick).toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    render(<DialogClose className="custom-close">Close</DialogClose>)

    const closeButton = screen.getByTestId('dialog-close')
    expect(closeButton).toHaveClass('custom-close')
  })
})

describe('DialogOverlay', () => {
  it('should render overlay with correct classes', () => {
    render(<DialogOverlay />)

    const overlay = screen.getByTestId('dialog-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveClass(
      'data-[state=open]:animate-in',
      'data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0',
      'data-[state=open]:fade-in-0',
      'fixed',
      'inset-0',
      'z-50',
      'bg-black/80'
    )
  })

  it('should apply custom className', () => {
    render(<DialogOverlay className="custom-overlay" />)

    const overlay = screen.getByTestId('dialog-overlay')
    expect(overlay).toHaveClass('custom-overlay')
  })

  it('should handle ref', () => {
    const ref = vi.fn()
    render(<DialogOverlay ref={ref} />)

    expect(ref).toHaveBeenCalled()
  })
})

describe('Complete Dialog Integration', () => {
  it('should render a complete dialog', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument()
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
    expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    expect(screen.getByText('Dialog Description')).toBeInTheDocument()
    expect(screen.getByText('Dialog Content')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('should handle dialog state changes', () => {
    const handleOpenChange = vi.fn()
    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    const trigger = screen.getByTestId('dialog-trigger')
    fireEvent.click(trigger)
    expect(handleOpenChange).toHaveBeenCalled()
  })

  it('should handle close button click', async () => {
    const handleClose = vi.fn()
    render(
      <Dialog>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogClose onClick={handleClose}>Close</DialogClose>
        </DialogContent>
      </Dialog>
    )

    const closeButtons = screen.getAllByTestId('dialog-close')
    await userEvent.click(closeButtons[0]) // Click the first close button
    expect(handleClose).toHaveBeenCalled()
  })
})
