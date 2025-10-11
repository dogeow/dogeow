/**
 * 用户筛选器组件
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'

type SortOption = 'name' | 'joined' | 'status'
type FilterOption = 'all' | 'online' | 'moderators'

interface UserFiltersProps {
  sortBy: SortOption
  filterBy: FilterOption
  onSortChange: (sort: SortOption) => void
  onFilterChange: (filter: FilterOption) => void
}

export function UserFilters({ sortBy, filterBy, onSortChange, onFilterChange }: UserFiltersProps) {
  return (
    <div className="flex space-x-2">
      <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
        <SelectTrigger className="h-8 flex-1 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">按名称排序</SelectItem>
          <SelectItem value="joined">按加入时间排序</SelectItem>
          <SelectItem value="status">按状态排序</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterBy} onValueChange={(value: FilterOption) => onFilterChange(value)}>
        <SelectTrigger className="h-8 flex-1 text-sm">
          <Filter className="mr-2 h-3 w-3" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部用户</SelectItem>
          <SelectItem value="online">仅在线</SelectItem>
          <SelectItem value="moderators">版主</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
