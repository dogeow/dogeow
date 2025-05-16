"use client"

import * as React from "react"
import { ChevronsUpDown, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const [searchTerm, setSearchTerm] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  // 处理标签点击
  const toggleTag = React.useCallback((tagId: string) => {
    console.log("标签点击: ", tagId)
    
    let newSelected: string[]
    
    if (selectedTags.includes(tagId)) {
      // 移除标签
      newSelected = selectedTags.filter(id => id !== tagId)
    } else {
      // 添加标签
      newSelected = [...selectedTags, tagId]
    }
    
    console.log("更新后的标签: ", newSelected)
    
    // 直接通知父组件
    onChange(newSelected)
  }, [selectedTags, onChange])

  // 过滤标签
  const filteredTags = React.useMemo(() => {
    if (!searchTerm) return tags;
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tags, searchTerm]);

  // 点击外部关闭下拉框
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectorContent = (
    <div ref={containerRef} className="relative">
      <Button
        variant={variant}
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between", className)}
        onClick={() => setOpen(!open)}
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
      
      {open && (
        <div className="absolute left-0 z-10 w-full mt-1 bg-popover rounded-md border shadow-md overflow-hidden">
          <div className="flex flex-col">
            {/* 搜索框 */}
            <div className="p-2 border-b">
              <input
                placeholder="搜索标签..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            
            {/* 标签列表 */}
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredTags.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredTags.map(tag => {
                    const tagId = tag.id.toString();
                    const isSelected = selectedTags.includes(tagId);
                    return (
                      <div
                        key={tagId}
                        onClick={() => toggleTag(tagId)}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : "opacity-50"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm">{tag.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
      
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedTags.map(tagId => {
            const tag = tags.find(t => t.id.toString() === tagId)
            return tag ? (
              <Badge
                key={tagId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleTag(tagId)}
              >
                <span>{tag.name}</span>
                <X className="ml-1 h-3 w-3 opacity-60" />
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )
} 