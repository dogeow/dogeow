import { ApiSubmitItemData } from '../../types'
import { ItemFormSchemaType } from './formConstants'

// API 返回的物品数据类型
interface ApiItemData {
  name?: string
  description?: string
  quantity?: number
  status?: string
  purchase_date?: string | null
  expiry_date?: string | null
  purchase_price?: number | null
  category_id?: string | number
  spot_id?: string | number
  spot?: {
    room?: {
      id?: number
      area?: {
        id?: number
      }
    }
  }
  is_public?: boolean
}

/**
 * 将表单数据转换为API提交格式
 */
export function transformFormDataForSubmit(
  data: ItemFormSchemaType,
  uploadedImages: Array<{ path: string; id?: number }>,
  selectedTags: string[]
): ApiSubmitItemData {
  // 处理分类ID：空字符串、'none' 或 '0' 都转换为 null（未分类）
  const getCategoryId = (categoryId: string): string | null => {
    if (!categoryId || categoryId === 'none' || categoryId === '0' || categoryId === '') {
      return null
    }
    return String(categoryId)
  }

  return {
    name: data.name,
    description: data.description,
    quantity: data.quantity,
    status: data.status,
    purchase_date: data.purchase_date ?? null,
    expiry_date: data.expiry_date ?? null,
    purchase_price: data.purchase_price,
    category_id: getCategoryId(data.category_id),
    area_id: data.area_id ? String(data.area_id) : '',
    room_id: data.room_id ? String(data.room_id) : '',
    spot_id: data.spot_id ? String(data.spot_id) : '',
    is_public: data.is_public,
    thumbnail_url: null,
    image_paths: uploadedImages.map(img => img.path),
    tags: selectedTags.length > 0 ? (selectedTags.map(id => Number(id)) as number[]) : undefined,
  }
}

/**
 * 将API数据转换为表单格式
 */
export function transformApiDataToFormData(item: ApiItemData): ItemFormSchemaType {
  return {
    name: item.name || '',
    description: item.description || '',
    quantity: item.quantity || 1,
    status: item.status || 'active',
    purchase_date: item.purchase_date ? new Date(item.purchase_date) : null,
    expiry_date: item.expiry_date ? new Date(item.expiry_date) : null,
    purchase_price: item.purchase_price || null,
    category_id: item.category_id ? item.category_id.toString() : '', // null或undefined转为空字符串
    area_id: item.spot?.room?.area?.id?.toString() || '',
    room_id: item.spot?.room?.id?.toString() || '',
    spot_id: item.spot_id?.toString() || '',
    is_public: item.is_public || false,
  }
}
