import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Tag, Check, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tag as TagType } from '../types'
import CreateTagDialog from './CreateTagDialog'
import { cn, isLightColor } from '@/lib/helpers'
import { Input } from '@/components/ui/input'

interface TagsSectionProps {
  selectedTags: string[]
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>
  tags: TagType[]
  onTagCreated: (tag: TagType) => void
}

const TagsSection: React.FC<TagsSectionProps> = ({
  selectedTags,
  setSelectedTags,
  tags,
  onTagCreated,
}) => {
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getTagStyle = (color: string = '#3b82f6') => ({
    backgroundColor: color,
    color: isLightColor(color) ? '#000' : '#fff',
  })

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const filteredTags = tags.filter(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCreateNewTag = () => {
    setNewTagName(searchTerm)
    setCreateTagDialogOpen(true)
    setIsDropdownOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>标签</CardTitle>
          <CardDescription>编辑物品的标签</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tags" className="mb-2 flex items-center justify-between">
                <span>标签</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setCreateTagDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <Tag className="h-3.5 w-3.5" />
                </Button>
              </Label>

              <div className="relative">
                <div
                  ref={triggerRef}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                >
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.length > 0 ? (
                      <span className="text-sm">已选择 {selectedTags.length} 项</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">选择标签</span>
                    )}
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>

                {isDropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="bg-popover border-border absolute bottom-[calc(100%+5px)] left-0 z-[1000] w-full rounded-md border shadow-md"
                  >
                    <div className="p-2">
                      <Input
                        placeholder="搜索标签..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {filteredTags.length === 0 ? (
                        <div className="py-3 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCreateNewTag}
                            className="w-full"
                          >
                            添加标签《{searchTerm}》
                          </Button>
                        </div>
                      ) : (
                        filteredTags.map(tag => {
                          const isSelected = selectedTags.includes(tag.id.toString())
                          return (
                            <div
                              key={tag.id}
                              className={cn(
                                'hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none',
                                isSelected && 'bg-accent/50'
                              )}
                              onClick={() => toggleTag(tag.id.toString())}
                            >
                              <div
                                className={cn(
                                  'border-primary absolute left-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                  isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50'
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <Badge
                                style={getTagStyle(tag.color)}
                                className="my-0.5 mr-2 px-2 py-0.5"
                              >
                                {tag.name}
                              </Badge>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedTags.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block text-xs">已选标签:</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id.toString() === tagId)
                    return tag ? (
                      <Badge
                        key={tag.id}
                        style={getTagStyle(tag.color)}
                        className="my-0.5 px-2 py-0.5"
                      >
                        {tag.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateTagDialog
        open={createTagDialogOpen}
        onOpenChange={setCreateTagDialogOpen}
        onTagCreated={onTagCreated}
        initialName={newTagName}
      />
    </>
  )
}

export default TagsSection
