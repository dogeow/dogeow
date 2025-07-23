'use client'

import * as React from 'react'
import { Check, X, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export interface MultiSelectProps {
  options?: { label: string; value: string; disabled?: boolean }[]
  placeholder?: string
  value?: string[]
  onValueChange?: (value: string[]) => void
  defaultValue?: string[]
  className?: string
  closeOnSelect?: boolean
  children?: React.ReactNode
}

export interface MultiSelectContextValue {
  value: string[]
  onValueChange: (value: string[]) => void
  closeOnSelect: boolean
}

const MultiSelectContext = React.createContext<MultiSelectContextValue | undefined>(undefined)

export function useMultiSelect() {
  const context = React.useContext(MultiSelectContext)
  if (!context) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider')
  }
  return context
}

export function MultiSelect({
  options,
  placeholder = '选择选项',
  value,
  onValueChange,
  defaultValue = [],
  closeOnSelect = false,
  className,
  children,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value || defaultValue)

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(value)
    }
  }, [value])

  const handleValueChange = React.useCallback(
    (values: string[]) => {
      setSelectedValues(values)
      onValueChange?.(values)
    },
    [onValueChange]
  )

  const contextValue = React.useMemo(
    () => ({
      value: selectedValues,
      onValueChange: handleValueChange,
      closeOnSelect,
    }),
    [selectedValues, handleValueChange, closeOnSelect]
  )

  const handleUnselect = (value: string) => {
    handleValueChange(selectedValues.filter(v => v !== value))
  }

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            className={cn('w-full justify-between', className)}
          >
            <div className="flex flex-wrap gap-1">
              {selectedValues.length > 0 ? (
                options ? (
                  selectedValues.map(value => {
                    const option = options.find(o => o.value === value)
                    return option ? (
                      <Badge key={value} variant="secondary" className="mr-1 mb-1">
                        {option.label}
                        <button
                          className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleUnselect(value)
                            }
                          }}
                          onMouseDown={e => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onClick={() => handleUnselect(value)}
                        >
                          <X className="text-muted-foreground hover:text-foreground h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  })
                ) : (
                  <span className="text-sm">已选择 {selectedValues.length} 项</span>
                )
              ) : (
                <span className="text-muted-foreground text-sm">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          {children ? (
            children
          ) : options ? (
            <Command>
              <CommandInput placeholder="搜索选项..." />
              <CommandList>
                <CommandEmpty>未找到选项</CommandEmpty>
                <CommandGroup>
                  {options.map(option => {
                    const isSelected = selectedValues.includes(option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        disabled={option.disabled}
                        onSelect={() => {
                          if (isSelected) {
                            handleValueChange(selectedValues.filter(v => v !== option.value))
                          } else {
                            handleValueChange([...selectedValues, option.value])
                          }

                          if (closeOnSelect) {
                            setOpen(false)
                          }
                        }}
                      >
                        <div
                          className={cn(
                            'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          )}
                        >
                          <Check className={cn('h-4 w-4')} />
                        </div>
                        {option.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          ) : null}
        </PopoverContent>
      </Popover>
    </MultiSelectContext.Provider>
  )
}

export function MultiSelectTrigger({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverTrigger>) {
  return (
    <PopoverTrigger
      className={cn(
        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </PopoverTrigger>
  )
}

export function MultiSelectValue({
  children,
  placeholder = '选择选项',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { placeholder?: string }) {
  const { value } = useMultiSelect()

  return (
    <div className={cn('flex flex-wrap gap-1', className)} {...props}>
      {value.length > 0 ? (
        children || <span className="text-sm">已选择 {value.length} 项</span>
      ) : (
        <span className="text-muted-foreground text-sm">{placeholder}</span>
      )}
    </div>
  )
}

export function MultiSelectContent({
  children,
  className,
  avoidCollisions = false,
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  sticky = 'always',
  collisionPadding = 0,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverContent> & {
  avoidCollisions?: boolean
  sticky?: boolean | 'always' | 'partial'
  collisionPadding?: number
}) {
  return (
    <PopoverContent
      className={cn('w-[var(--radix-popover-trigger-width)] p-0', className)}
      align={align}
      side={side}
      sideOffset={sideOffset}
      avoidCollisions={avoidCollisions}
      sticky={sticky}
      collisionPadding={collisionPadding}
      {...props}
    >
      <div className="max-h-[300px] overflow-y-auto">{children}</div>
    </PopoverContent>
  )
}

export function MultiSelectItem({
  children,
  value,
  disabled,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }) {
  const { value: selectedValues, onValueChange } = useMultiSelect()
  const isSelected = selectedValues.includes(value)

  return (
    <div
      className={cn(
        'hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
      data-disabled={disabled}
      onClick={() => {
        if (disabled) return

        if (isSelected) {
          onValueChange(selectedValues.filter(v => v !== value))
        } else {
          onValueChange([...selectedValues, value])
        }
      }}
    >
      <div
        className={cn(
          'border-primary absolute left-2 flex h-4 w-4 items-center justify-center rounded-sm border',
          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
        )}
      >
        <Check className={cn('h-4 w-4')} />
      </div>
      {children}
    </div>
  )
}

export function MultiSelectLabel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props}>
      {children}
    </div>
  )
}
