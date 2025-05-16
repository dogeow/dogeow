"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface Tag {
  id: string | number
  name: string
  color?: string
}

interface TagSelectorProps {
  tags: Tag[]
  selectedTags: string[]
  onChange: (selectedTags: string[]) => void
  placeholder?: string
  emptyText?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  showTabs?: boolean
  tabNames?: { basic: string; detail: string }
}

export function TagSelector({
  tags,
  selectedTags = [],
  onChange,
  placeholder = "选择标签",
  emptyText = "未找到标签",
  className,
  variant = "outline",
  showTabs = false,
  tabNames = { basic: "基础", detail: "详细" }
}: TagSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("basic")
  const [localSelectedTags, setLocalSelectedTags] = React.useState<string[]>(selectedTags)

  // 当外部selectedTags发生变化时，更新本地状态
  React.useEffect(() => {
    setLocalSelectedTags(selectedTags)
  }, [selectedTags])

  // 处理标签点击
  const toggleTag = (tagId: string) => {
    console.log("标签点击: ", tagId)
    console.log("当前本地已选标签: ", localSelectedTags)
    console.log("当前传入的已选标签: ", selectedTags)
    
    let newSelected: string[]
    
    if (localSelectedTags.includes(tagId)) {
      // 移除标签
      newSelected = localSelectedTags.filter(id => id !== tagId)
    } else {
      // 添加标签
      newSelected = [...localSelectedTags, tagId]
    }
    
    console.log("更新后的标签: ", newSelected)
    
    // 更新本地状态
    setLocalSelectedTags(newSelected)
    
    // 通知父组件
    onChange(newSelected)
  }
  
  // 选择命令项处理
  const handleCommandSelect = (value: string) => {
    console.log("Command选择值: ", value)
    toggleTag(value)
  }

  console.log("渲染TagSelector, 标签数:", tags.length, "已选标签:", selectedTags)

  const selectorContent = (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={variant}
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tagId => {
                  const tag = tags.find(t => t.id.toString() === tagId)
                  return tag ? (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ) : null
                })}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="搜索标签..." />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {tags.map(tag => {
                  const tagId = tag.id.toString()
                  const isSelected = localSelectedTags.includes(tagId)
                  return (
                    <CommandItem
                      key={tagId}
                      value={tagId}
                      onSelect={handleCommandSelect}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span>{tag.name}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 备用标签列表，以防下拉菜单不工作 */}
      <div className="flex flex-wrap gap-1 mt-3 border-t pt-2">
        <span className="text-xs text-muted-foreground mb-1 w-full">点击直接选择标签:</span>
        {tags.map(tag => {
          const tagId = tag.id.toString()
          const isSelected = localSelectedTags.includes(tagId)
          return (
            <Badge
              key={tagId}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tagId)}
            >
              {tag.name}
            </Badge>
          )
        })}
      </div>

      {localSelectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 border-t pt-2">
          <span className="text-xs text-muted-foreground mb-1 w-full">已选标签:</span>
          {localSelectedTags.map(tagId => {
            const tag = tags.find(t => t.id.toString() === tagId)
            return tag ? (
              <Badge
                key={tagId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleTag(tagId)}
              >
                <span>{tag.name}</span>
                <span className="ml-1 opacity-60">×</span>
              </Badge>
            ) : null
          })}
        </div>
      )}
    </>
  )

  if (showTabs) {
    return (
      <div className="space-y-4">
        <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted rounded-full p-1">
            <TabsTrigger value="basic" className="rounded-full">{tabNames.basic}</TabsTrigger>
            <TabsTrigger value="detail" className="rounded-full">{tabNames.detail}</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="mt-4">
            {selectorContent}
          </TabsContent>
          <TabsContent value="detail" className="mt-4">
            {/* 在这里添加详细内容 */}
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">详细设置内容可以放在这里</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectorContent}
    </div>
  )
} 