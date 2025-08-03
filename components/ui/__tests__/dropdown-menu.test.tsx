import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../dropdown-menu'

describe('DropdownMenu', () => {
  describe('basic functionality', () => {
    it('should render trigger and content', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="content">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveTextContent('Open Menu')

      // Content should not be visible initially
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()

      // Click trigger to open menu
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument()
      })
    })

    it('should handle menu item clicks', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleClick} data-testid="menu-item">
              Click me
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('menu-item'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('DropdownMenuItem', () => {
    it('should render with default variant', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem data-testid="menu-item">Default Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toBeInTheDocument()
        expect(menuItem).toHaveAttribute('data-variant', 'default')
      })
    })

    it('should render with destructive variant', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive" data-testid="menu-item">
              Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toBeInTheDocument()
        expect(menuItem).toHaveAttribute('data-variant', 'destructive')
      })
    })

    it('should handle inset prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset data-testid="menu-item">
              Inset Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toBeInTheDocument()
        expect(menuItem).toHaveAttribute('data-inset', 'true')
      })
    })

    it('should handle disabled state', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled onClick={handleClick} data-testid="menu-item">
              Disabled Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const menuItem = screen.getByTestId('menu-item')
        expect(menuItem).toBeInTheDocument()
        expect(menuItem).toHaveAttribute('data-disabled')
      })

      // Disabled items should not trigger click events
      const menuItem = screen.getByTestId('menu-item')
      expect(menuItem).toHaveAttribute('data-disabled')
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('DropdownMenuCheckboxItem', () => {
    it('should render checkbox item', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem data-testid="checkbox-item">
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const checkboxItem = screen.getByTestId('checkbox-item')
        expect(checkboxItem).toBeInTheDocument()
        expect(checkboxItem).toHaveTextContent('Checkbox Item')
      })
    })

    it('should handle checked state', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked data-testid="checkbox-item">
              Checked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const checkboxItem = screen.getByTestId('checkbox-item')
        expect(checkboxItem).toBeInTheDocument()
        expect(checkboxItem).toHaveAttribute('data-state', 'checked')
      })
    })
  })

  describe('DropdownMenuRadioGroup', () => {
    it('should render radio group with radio items', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" data-testid="radio-group">
              <DropdownMenuRadioItem value="option1" data-testid="radio-item-1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2" data-testid="radio-item-2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('radio-group')).toBeInTheDocument()
        expect(screen.getByTestId('radio-item-1')).toBeInTheDocument()
        expect(screen.getByTestId('radio-item-2')).toBeInTheDocument()
      })
    })
  })

  describe('DropdownMenuLabel', () => {
    it('should render label', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel data-testid="label">Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const label = screen.getByTestId('label')
        expect(label).toBeInTheDocument()
        expect(label).toHaveTextContent('Menu Label')
      })
    })

    it('should handle inset prop', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset data-testid="label">
              Inset Label
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const label = screen.getByTestId('label')
        expect(label).toBeInTheDocument()
        expect(label).toHaveAttribute('data-inset', 'true')
      })
    })
  })

  describe('DropdownMenuSeparator', () => {
    it('should render separator', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const separator = screen.getByTestId('separator')
        expect(separator).toBeInTheDocument()
      })
    })
  })

  describe('DropdownMenuShortcut', () => {
    it('should render shortcut', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Copy
              <DropdownMenuShortcut data-testid="shortcut">⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const shortcut = screen.getByTestId('shortcut')
        expect(shortcut).toBeInTheDocument()
        expect(shortcut).toHaveTextContent('⌘C')
      })
    })
  })

  describe('DropdownMenuSub', () => {
    it('should render sub menu', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger data-testid="sub-trigger">
                More Options
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent data-testid="sub-content">
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
                <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const subTrigger = screen.getByTestId('sub-trigger')
        expect(subTrigger).toBeInTheDocument()
        expect(subTrigger).toHaveTextContent('More Options')
      })

      // Sub content should not be visible initially
      expect(screen.queryByTestId('sub-content')).not.toBeInTheDocument()

      // Click sub trigger to open sub menu
      await user.click(screen.getByTestId('sub-trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('sub-content')).toBeInTheDocument()
      })
    })
  })

  describe('DropdownMenuGroup', () => {
    it('should render group', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup data-testid="group">
              <DropdownMenuItem>Group Item 1</DropdownMenuItem>
              <DropdownMenuItem>Group Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const group = screen.getByTestId('group')
        expect(group).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger" aria-label="Open menu">
            Open Menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem aria-label="Menu item">Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveAttribute('aria-label', 'Open menu')

      await user.click(trigger)

      await waitFor(() => {
        const menuItem = screen.getByLabelText('Menu item')
        expect(menuItem).toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty content', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="content" />
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        expect(content).toBeInTheDocument()
      })
    })

    it('should handle custom className', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content" data-testid="content">
            <DropdownMenuItem className="custom-item" data-testid="menu-item">
              Custom Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger'))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        const menuItem = screen.getByTestId('menu-item')

        expect(content).toHaveClass('custom-content')
        expect(menuItem).toHaveClass('custom-item')
      })
    })
  })
})
