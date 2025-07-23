import { Controller, UseFormReturn } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { ItemFormData } from '../../types'

interface DetailInfoFormProps {
  formMethods: UseFormReturn<ItemFormData>
}

export default function DetailInfoForm({ formMethods }: DetailInfoFormProps) {
  const { control } = formMethods

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Textarea id="description" rows={4} {...field} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="h-10 w-full">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    align="start"
                    sideOffset={4}
                    avoidCollisions={false}
                    className="z-[100]"
                  >
                    <SelectItem value="active">使用中</SelectItem>
                    <SelectItem value="inactive">闲置</SelectItem>
                    <SelectItem value="expired">已过期</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_public">公开物品</Label>
            <div className="flex h-10 items-center">
              <Controller
                name="is_public"
                control={control}
                render={({ field }) => (
                  <Switch id="is_public" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">购买日期</Label>
              <Controller
                name="purchase_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value ? new Date(field.value) : null}
                    setDate={date => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                    placeholder="选择日期"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">过期日期</Label>
              <Controller
                name="expiry_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value ? new Date(field.value) : null}
                    setDate={date => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                    placeholder="选择日期"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_price">购买价格</Label>
              <Controller
                name="purchase_price"
                control={control}
                render={({ field }) => (
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.value !== null ? field.value : ''}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
