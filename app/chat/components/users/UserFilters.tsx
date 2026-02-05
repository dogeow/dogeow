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
import type { SortOption, FilterOption } from '@/app/chat/utils/users/filterUtils'

interface UserFiltersProps {
  sortBy: SortOption
  filterBy: FilterOption
  onSortChange: (sort: SortOption) => void
  onFilterChange: (filter: FilterOption) => void
  sortLabels?: {
    name: string
    joined: string
    status: string
  }
  filterLabels?: {
    all: string
    online: string
    moderators: string
  }
}

export function UserFilters({
  sortBy,
  filterBy,
  onSortChange,
  onFilterChange,
  sortLabels = {
    name: '按名称排序',
    joined: '按加入时间排序',
    status: '按状态排序',
  },
  filterLabels = {
    all: '全部用户',
    online: '仅在线',
    moderators: '版主',
  },
}: UserFiltersProps) {
  return (
    <div className="flex space-x-2">
      <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
        <SelectTrigger className="h-8 flex-1 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">{sortLabels.name}</SelectItem>
          <SelectItem value="joined">{sortLabels.joined}</SelectItem>
          <SelectItem value="status">{sortLabels.status}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterBy} onValueChange={(value: FilterOption) => onFilterChange(value)}>
        <SelectTrigger className="h-8 flex-1 text-sm">
          <Filter className="mr-2 h-3 w-3" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{filterLabels.all}</SelectItem>
          <SelectItem value="online">{filterLabels.online}</SelectItem>
          <SelectItem value="moderators">{filterLabels.moderators}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
