/**
 * 基础筛选组件
 */
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BasicFiltersProps {
  name: string
  description: string
  status: string
  isPublic: boolean | null
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onStatusChange: (value: string) => void
  onIsPublicChange: (value: boolean | null) => void
}

export function BasicFilters({
  name,
  description,
  status,
  isPublic,
  onNameChange,
  onDescriptionChange,
  onStatusChange,
  onIsPublicChange,
}: BasicFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">名称</Label>
        <Input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">描述</Label>
        <Input
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">状态</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="bg-background text-foreground h-11 border-none">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">使用中</SelectItem>
            <SelectItem value="archived">已归档</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">公开状态</Label>
        <Select
          value={isPublic === null ? 'null' : isPublic === true ? 'true' : 'false'}
          onValueChange={value => onIsPublicChange(value === 'null' ? null : value === 'true')}
        >
          <SelectTrigger className="bg-background border-input text-foreground h-11 border">
            <SelectValue placeholder="所有物品" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">所有物品</SelectItem>
            <SelectItem value="true">公开</SelectItem>
            <SelectItem value="false">私有</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
