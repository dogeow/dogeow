import { z } from 'zod'

// 位置相关类型定义
export type LocationType = 'area' | 'room' | 'spot'

export type Location = {
  id: number
  name: string
  [key: string]: unknown
}

export type SelectedLocation =
  | {
      type: LocationType
      id: number
    }
  | undefined

// 表单验证Schema
export const itemFormSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  description: z.string(),
  quantity: z.number().int().min(1, '数量必须大于0'),
  status: z.string(),
  purchase_date: z.union([z.date(), z.null()]),
  expiry_date: z.union([z.date(), z.null()]),
  purchase_price: z.union([z.number(), z.null()]),
  category_id: z.string(),
  area_id: z.string(),
  room_id: z.string(),
  spot_id: z.string(),
  is_public: z.boolean(),
})

// 表单数据类型
export type ItemFormSchemaType = z.infer<typeof itemFormSchema>

// 默认表单值
export const defaultFormValues: ItemFormSchemaType = {
  name: '',
  description: '',
  quantity: 1,
  status: 'active',
  purchase_date: null,
  expiry_date: null,
  purchase_price: null,
  category_id: 'none',
  area_id: '',
  room_id: '',
  spot_id: '',
  is_public: false,
}