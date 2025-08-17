'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'

import { cn } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  onCreateOption?: (input: string) => void
  placeholder?: string
  emptyText?: string
  createText?: string
  searchText?: string
  className?: string
}

export function Combobox({
  options = [],
  value,
  onChange,
  onCreateOption,
  placeholder = '选择选项...',
  emptyText = '没有找到选项',
  createText = '创建',
  searchText = '搜索选项...',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // 检测是否为移动设备
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter(option => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [options, searchQuery])

  const handleCreateOption = React.useCallback(() => {
    if (onCreateOption && searchQuery && searchQuery.trim()) {
      console.log('正在创建选项:', searchQuery.trim())
      onCreateOption(searchQuery.trim())
      setSearchQuery('')
      setOpen(false)
    }
  }, [onCreateOption, searchQuery])

  const handleSelect = React.useCallback(
    (selectedOption: ComboboxOption) => {
      console.log('handleSelect called with:', selectedOption)
      onChange(selectedOption.value)
      setSearchQuery('')
      setOpen(false)
    },
    [onChange]
  )

  // 检查是否显示创建选项
  const showCreateOption =
    onCreateOption && searchQuery && searchQuery.trim().length > 0 && filteredOptions.length === 0

  // 获取当前选中项的显示文本
  const selectedOption = options.find(option => option.value === value)
  const displayText = selectedOption?.label || (value ? value : placeholder)

  // 处理弹出层开关
  const handleOpen = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen)
  }, [])

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <span className={cn(selectedOption ? '' : 'text-muted-foreground')}>{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="fixed z-[9999] w-[280px] min-w-[--radix-popover-trigger-width] p-0"
        side="top"
        align="start"
        sideOffset={4}
        avoidCollisions={false}
        collisionPadding={8}
      >
        <div className="flex flex-col">
          {/* 搜索输入框 */}
          <div className="border-b p-2">
            <Input
              placeholder={searchText}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8"
              autoComplete="off"
              autoFocus={!isMobile} // 移动端不自动focus，避免弹出键盘
            />
          </div>

          {/* 选项列表 */}
          <ScrollArea>
            <div className="p-1">
              {/* 创建新选项 */}
              {showCreateOption && (
                <div
                  className="hover:bg-accent hover:text-accent-foreground text-primary mb-1 flex cursor-pointer items-center rounded-sm border-b px-2 py-1.5 text-sm"
                  onClick={handleCreateOption}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>
                    {createText}: <strong>{searchQuery}</strong>
                  </span>
                </div>
              )}

              {/* 选项列表 */}
              {filteredOptions.length === 0 && !showCreateOption ? (
                <div className="text-muted-foreground px-2 py-2 text-center text-sm">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.value}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm',
                      option.disabled && 'cursor-not-allowed opacity-50'
                    )}
                    onClick={() => {
                      if (!option.disabled) {
                        console.log('点击选项:', option)
                        handleSelect(option)
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
