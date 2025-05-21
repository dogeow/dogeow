"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/helpers"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  
  // 过滤选项，用于检查搜索结果是否为空
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

  // 检查是否显示创建选项
  const showCreateOption = onCreateOption && searchQuery && searchQuery.trim().length > 0
  const showEmpty = filteredOptions.length === 0 || (searchQuery && filteredOptions.length === 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? (
            options.find((option) => option.value === value)?.label || value
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1
          return 0
        }}>
          <CommandInput 
            placeholder={searchText} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {showCreateOption && (
              <div 
                className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center text-primary"
                onClick={handleCreateOption}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>{createText}: <strong>{searchQuery}</strong></span>
              </div>
            )}
            
            {showEmpty && (
              <CommandEmpty>
                {showCreateOption ? (
                  <div 
                    className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center text-primary"
                    onClick={handleCreateOption}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>{createText}: <strong>{searchQuery}</strong></span>
                  </div>
                ) : (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    {emptyText}
                  </div>
                )}
              </CommandEmpty>
            )}
            
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={(currentValue) => {
                    if (currentValue) {
                      onChange(currentValue)
                      setOpen(false)
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 