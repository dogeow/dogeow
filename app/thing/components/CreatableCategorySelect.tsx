import { useState, useMemo } from 'react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string | number
  name: string
}

interface CreatableCategorySelectProps {
  value: string | number
  onValueChange: (value: string) => void
  categories: Category[]
  allowNoneOption?: boolean
  onCreateCategory?: (name: string) => Promise<Category>
}

export default function CreatableCategorySelect({
  value,
  onValueChange,
  categories,
  allowNoneOption,
  onCreateCategory,
}: CreatableCategorySelectProps) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const [, setCreating] = useState(false)
  const [showInput, setShowInput] = useState(false)

  // 过滤后的分类
  const filtered = useMemo(() => {
    const v = inputValue.trim().toLowerCase()
    return categories.filter(cat => cat.name.toLowerCase().includes(v))
  }, [categories, inputValue])

  // 判断当前输入是否已存在
  const exists = filtered.some(cat => cat.name === inputValue.trim())

  // 调试：渲染前打印
  console.log('filtered:', filtered, 'inputValue:', inputValue, 'exists:', exists)

  // 选中项的显示文本
  const selectedLabel = useMemo(() => {
    if (allowNoneOption && (value === 'none' || value === undefined || value === null))
      return '未分类'
    const found = categories.find(cat => cat.id.toString() === value?.toString())
    return found ? found.name : '选择分类'
  }, [categories, value, allowNoneOption])

  // 新增分类（此处仅回调，实际应由父组件处理 API）
  const handleCreate = async () => {
    console.log('handleCreate 被调用，inputValue:', inputValue, 'exists:', exists)
    if (!inputValue.trim() || exists) return
    setCreating(true)
    if (onCreateCategory) {
      try {
        const newCategory = await onCreateCategory(inputValue.trim())
        onValueChange(newCategory.id.toString())
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : typeof e === 'string' ? e : '创建分类失败'
        toast.error(errorMessage)
      } finally {
        setCreating(false)
        setInputValue('')
        setOpen(false)
      }
    } else {
      onValueChange(inputValue.trim())
      setInputValue('')
      setCreating(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="flex w-full items-center justify-between"
        onClick={() => {
          const newOpen = !open
          setOpen(newOpen)
          if (newOpen) {
            // 延迟显示输入框，避免自动聚焦
            setTimeout(() => setShowInput(true), 100)
          } else {
            setShowInput(false)
            setInputValue('')
          }
        }}
      >
        <span>{selectedLabel}</span>
        <span className="text-muted-foreground ml-2">▼</span>
      </Button>
      {open && (
        <div className="bg-popover border-border absolute z-50 mt-1 w-full rounded-md border shadow-lg">
          <Command>
            {showInput && (
              <CommandInput
                placeholder="输入或选择分类"
                value={inputValue}
                onValueChange={setInputValue}
                autoFocus={false} // 不自动focus，避免弹出键盘，用户需要搜索时可以手动点击输入框
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="text"
              />
            )}
            <CommandList>
              {allowNoneOption && (
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onValueChange('none')
                    setOpen(false)
                  }}
                >
                  未分类
                </CommandItem>
              )}
              {filtered.map(cat => (
                <CommandItem
                  key={cat.id}
                  value={cat.id.toString()}
                  onSelect={() => {
                    onValueChange(cat.id.toString())
                    setOpen(false)
                  }}
                >
                  {cat.name}
                </CommandItem>
              ))}
              {filtered.length === 0 && inputValue.trim() && !exists && (
                <CommandItem
                  value={inputValue.trim()}
                  onSelect={() => {
                    console.log('CommandItem onSelect 触发，准备创建分类')
                    handleCreate()
                  }}
                  onClick={() => {
                    console.log('CommandItem onClick 触发，准备创建分类')
                    handleCreate()
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  添加&quot;{inputValue.trim()}&quot;
                </CommandItem>
              )}
              {filtered.length === 0 && (!inputValue.trim() || exists) && (
                <CommandEmpty>无匹配分类</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
