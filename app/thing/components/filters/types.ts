// 定义筛选条件类型
export interface FilterState {
  name: string
  description: string
  status: string
  tags: string[] | number[] | string
  category_id: string | number
  purchase_date_from: Date | null
  purchase_date_to: Date | null
  expiry_date_from: Date | null
  expiry_date_to: Date | null
  price_from: string | number
  price_to: string | number
  area_id: string | number
  room_id: string | number
  spot_id: string | number
  is_public: boolean | null
  include_null_purchase_date: boolean
  include_null_expiry_date: boolean
  exclude_null_purchase_date?: boolean
  exclude_null_expiry_date?: boolean
  [key: string]: unknown
}

// 初始筛选条件
export const initialFilters: FilterState = {
  name: '',
  description: '',
  status: 'all',
  tags: '',
  category_id: 'all',
  purchase_date_from: null,
  purchase_date_to: null,
  expiry_date_from: null,
  expiry_date_to: null,
  price_from: '',
  price_to: '',
  area_id: 'all',
  room_id: 'all',
  spot_id: 'all',
  is_public: null,
  include_null_purchase_date: false,
  include_null_expiry_date: false,
}
