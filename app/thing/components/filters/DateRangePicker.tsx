/**
 * 日期范围选择器组件
 */
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/helpers'

interface DateRangePickerProps {
  label: string
  fromDate: Date | null
  toDate: Date | null
  includeNull: boolean
  onFromDateChange: (date: Date | undefined) => void
  onToDateChange: (date: Date | undefined) => void
  onIncludeNullChange: (checked: boolean) => void
}

export function DateRangePicker({
  label,
  fromDate,
  toDate,
  includeNull,
  onFromDateChange,
  onToDateChange,
  onIncludeNullChange,
}: DateRangePickerProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{label}</Label>
      <div className="space-y-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-11 w-full justify-start text-left font-normal',
                !fromDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, 'yyyy-MM-dd') : <span>开始日期</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={fromDate || undefined}
              onSelect={onFromDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-11 w-full justify-start text-left font-normal',
                !toDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, 'yyyy-MM-dd') : <span>结束日期</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={toDate || undefined}
              onSelect={onToDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="mt-1 flex w-full items-center space-x-2">
          <Switch
            id={`include-null-${label}`}
            checked={includeNull}
            onCheckedChange={onIncludeNullChange}
          />
          <Label htmlFor={`include-null-${label}`} className="cursor-pointer text-xs">
            包含空日期的物品
          </Label>
        </div>
      </div>
    </div>
  )
}
