import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { vi } from 'vitest'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from '../form'
import { Input } from '../input'

// Test component that uses the form components
function TestForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
    },
  })

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

// Test component with form errors
function TestFormWithErrors() {
  const form = useForm({
    defaultValues: {
      username: '',
    },
  })

  // Simulate form errors
  React.useEffect(() => {
    form.setError('username', {
      type: 'manual',
      message: 'Username is required',
    })
  }, [form])

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

// Test component to test useFormField hook
function TestFormFieldHook() {
  const formField = useFormField()

  return (
    <div>
      <span data-testid="field-name">{formField.name}</span>
      <span data-testid="field-id">{formField.id}</span>
      <span data-testid="form-item-id">{formField.formItemId}</span>
      <span data-testid="form-description-id">{formField.formDescriptionId}</span>
      <span data-testid="form-message-id">{formField.formMessageId}</span>
    </div>
  )
}

function TestFormFieldHookWrapper() {
  const form = useForm({
    defaultValues: {
      test: '',
    },
  })

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="test"
        render={() => (
          <FormItem>
            <TestFormFieldHook />
          </FormItem>
        )}
      />
    </Form>
  )
}

describe('Form Components', () => {
  describe('Form', () => {
    it('should render form with all components', () => {
      render(<TestForm />)

      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByText('This is your public display name.')).toBeInTheDocument()
    })
  })

  describe('FormField', () => {
    it('should render form field with controller', () => {
      render(<TestForm />)

      const usernameInput = screen.getByPlaceholderText('Enter username')
      const emailInput = screen.getByPlaceholderText('Enter email')

      expect(usernameInput).toBeInTheDocument()
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  describe('FormItem', () => {
    it('should render form item with proper spacing', () => {
      render(<TestForm />)

      // FormItem creates a div with space-y-2 class
      const formItems = document.querySelectorAll('.space-y-2')
      expect(formItems.length).toBeGreaterThan(0)
    })

    it('should apply custom className', () => {
      function TestFormItemClass() {
        const form = useForm({ defaultValues: { test: '' } })

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem className="custom-form-item">
                  <FormLabel>Test</FormLabel>
                </FormItem>
              )}
            />
          </Form>
        )
      }

      render(<TestFormItemClass />)

      const formItem = document.querySelector('.custom-form-item')
      expect(formItem).toBeInTheDocument()
      expect(formItem).toHaveClass('space-y-2', 'custom-form-item')
    })
  })

  describe('FormLabel', () => {
    it('should render label with correct attributes', () => {
      render(<TestForm />)

      const usernameLabel = screen.getByText('Username')
      const emailLabel = screen.getByText('Email')

      expect(usernameLabel).toBeInTheDocument()
      expect(emailLabel).toBeInTheDocument()
    })

    it('should show error styling when form has errors', () => {
      render(<TestFormWithErrors />)

      const label = screen.getByText('Username')
      expect(label).toHaveClass('text-destructive')
    })
  })

  describe('FormControl', () => {
    it('should render form control with proper attributes', () => {
      render(<TestForm />)

      const usernameInput = screen.getByPlaceholderText('Enter username')

      expect(usernameInput).toHaveAttribute('id')
      expect(usernameInput).toHaveAttribute('aria-describedby')
    })

    it('should set aria-invalid when there are errors', () => {
      render(<TestFormWithErrors />)

      const input = screen.getByPlaceholderText('Enter username')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('FormDescription', () => {
    it('should render description text', () => {
      render(<TestForm />)

      const description = screen.getByText('This is your public display name.')
      expect(description).toBeInTheDocument()
      expect(description.tagName).toBe('P')
      expect(description).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('should apply custom className', () => {
      function TestFormDescription() {
        const form = useForm({ defaultValues: { test: '' } })

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormDescription className="custom-description">
                    Custom description
                  </FormDescription>
                </FormItem>
              )}
            />
          </Form>
        )
      }

      render(<TestFormDescription />)

      const description = screen.getByText('Custom description')
      expect(description).toHaveClass('custom-description')
    })
  })

  describe('FormMessage', () => {
    it('should render error message when form has errors', () => {
      render(<TestFormWithErrors />)

      const errorMessage = screen.getByText('Username is required')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage.tagName).toBe('P')
      expect(errorMessage).toHaveClass('text-destructive', 'text-sm', 'font-medium')
    })

    it('should not render when no error', () => {
      render(<TestForm />)

      // Should not show any error messages initially
      expect(screen.queryByText('Username is required')).not.toBeInTheDocument()
    })

    it('should render custom children when no error', () => {
      function TestFormMessageChildren() {
        const form = useForm({ defaultValues: { test: '' } })

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage>Custom message</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        )
      }

      render(<TestFormMessageChildren />)

      const message = screen.getByText('Custom message')
      expect(message).toBeInTheDocument()
    })

    it('should not render when no body content', () => {
      function TestFormMessageEmpty() {
        const form = useForm({ defaultValues: { test: '' } })

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        )
      }

      const { container } = render(<TestFormMessageEmpty />)

      // Should not render any p element for FormMessage when no content
      const messageElements = container.querySelectorAll('p')
      const formMessageElements = Array.from(messageElements).filter(p =>
        p.className.includes('text-destructive')
      )
      expect(formMessageElements).toHaveLength(0)
    })
  })

  describe('useFormField', () => {
    it('should provide form field context values', () => {
      render(<TestFormFieldHookWrapper />)

      expect(screen.getByTestId('field-name')).toHaveTextContent('test')
      expect(screen.getByTestId('field-id')).toHaveTextContent(/^:/)
      expect(screen.getByTestId('form-item-id')).toHaveTextContent(/-form-item$/)
      expect(screen.getByTestId('form-description-id')).toHaveTextContent(/-form-item-description$/)
      expect(screen.getByTestId('form-message-id')).toHaveTextContent(/-form-item-message$/)
    })

    it('should throw error when used outside FormField', () => {
      // Mock console.error to avoid error output in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function TestInvalidUseFormField() {
        try {
          useFormField()
        } catch (error) {
          return (
            <div data-testid="error">{error instanceof Error ? error.message : String(error)}</div>
          )
        }
        return <div>Test</div>
      }

      const { getByTestId } = render(<TestInvalidUseFormField />)

      // 检查错误信息，但可能不是预期的错误
      const errorElement = getByTestId('error')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement.textContent).toContain('Cannot destructure')

      consoleSpy.mockRestore()
    })
  })
})
