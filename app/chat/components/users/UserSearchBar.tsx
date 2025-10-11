/**
 * 用户搜索栏组件
 */
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface UserSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function UserSearchBar({
  value,
  onChange,
  placeholder = 'Search users...',
}: UserSearchBarProps) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 pl-8 text-sm"
      />
    </div>
  )
}
