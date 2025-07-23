"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  placeholder = "选择选项...",
  emptyText = "没有找到选项",
  createText = "创建",
  searchText = "搜索选项...",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  // 检测是否为移动设备和键盘状态
  const [isMobile, setIsMobile] = React.useState(false)
  const [keyboardHeight, setKeyboardHeight] = React.useState(0)
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // 监听键盘弹出/收起
  React.useEffect(() => {
    if (!isMobile) return
    
    const handleViewportChange = () => {
      const visualViewport = window.visualViewport
      if (visualViewport) {
        const keyboardHeight = window.innerHeight - visualViewport.height
        setKeyboardHeight(keyboardHeight)
      }
    }
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange)
      }
    }
  }, [isMobile])

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  const handleCreateOption = React.useCallback(() => {
    if (onCreateOption && searchQuery && searchQuery.trim()) {
      console.log("正在创建选项:", searchQuery.trim())
      onCreateOption(searchQuery.trim())
      setSearchQuery("")
      setOpen(false)
    }
  }, [onCreateOption, searchQuery])

  const handleSelect = React.useCallback((selectedOption: ComboboxOption) => {
    console.log("handleSelect called with:", selectedOption)
    onChange(selectedOption.value)
    setSearchQuery("")
    setOpen(false)
  }, [onChange])

  // 检查是否显示创建选项
  const showCreateOption = onCreateOption && searchQuery && searchQuery.trim().length > 0 && filteredOptions.length === 0

  // 获取当前选中项的显示文本
  const selectedOption = options.find(option => option.value === value)
  const displayText = selectedOption?.label || (value ? value : placeholder)

  // 处理移动端键盘弹出时的滚动
  const handleOpen = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    
    if (isMobile && isOpen) {
      // 延迟一点时间确保弹出层已经渲染
      setTimeout(() => {
        const trigger = document.querySelector('[role="combobox"]')
        if (trigger) {
          trigger.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
      }, 100)
    }
  }, [isMobile])

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className={cn(
            selectedOption ? "" : "text-muted-foreground"
          )}>
            {displayText}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[--radix-popover-trigger-width] p-0 z-50",
          isMobile && keyboardHeight > 0 && "shadow-2xl border-2"
        )}
        side={isMobile && keyboardHeight > 0 ? "top" : "bottom"}
        align="start"
        sideOffset={isMobile && keyboardHeight > 0 ? 8 : 4}
        avoidCollisions={true}
        collisionPadding={isMobile ? Math.max(32, keyboardHeight + 16) : 16}
        style={isMobile && keyboardHeight > 0 ? {
          maxHeight: `calc(100vh - ${keyboardHeight}px - 120px)`,
          position: 'fixed'
        } : undefined}
      >
        <div className="flex flex-col">
          {/* 搜索输入框 */}
          <div className="p-2 border-b">
            <Input
              placeholder={searchText}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "h-8",
                isMobile && "text-base" // 防止iOS缩放
              )}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
          
          {/* 选项列表 */}
          <ScrollArea className={cn(
            isMobile 
              ? keyboardHeight > 0 
                ? `max-h-[min(120px,calc(100vh - ${keyboardHeight}px - 160px))]`
                : "max-h-[min(150px,25dvh)]"
              : "max-h-[200px]"
          )}>
            <div className="p-1">
              {/* 创建新选项 */}
              {showCreateOption && (
                <div 
                  className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm text-primary border-b mb-1"
                  onClick={handleCreateOption}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>{createText}: <strong>{searchQuery}</strong></span>
                </div>
              )}
              
              {/* 选项列表 */}
              {filteredOptions.length === 0 && !showCreateOption ? (
                <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!option.disabled) {
                        console.log("点击选项:", option)
                        handleSelect(option)
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
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