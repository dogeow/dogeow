import { ItemFormData } from '../../types'
import { ItemFormSchemaType } from './formConstants'

/**
 * 将表单数据转换为API提交格式
 */
export function transformFormDataForSubmit(
  data: ItemFormSchemaType,
  uploadedImages: Array<{ path: string; id?: number }>,
  selectedTags: string[]
): ItemFormData {
  return {
    name: data.name,
    description: data.description,
    quantity: data.quantity,
    status: data.status,
    purchase_date: data.purchase_date
      ? data.purchase_date.toISOString().split('T')[0]
      : null,
    expiry_date: data.expiry_date
      ? data.expiry_date.toISOString().split('T')[0]
      : null,
    purchase_price: data.purchase_price,
    category_id:
      data.category_id && data.category_id !== 'none' ? Number(data.category_id) : null,
    area_id: data.area_id ? Number(data.area_id) : null,
    room_id: data.room_id ? Number(data.room_id) : null,
    spot_id: data.spot_id ? Number(data.spot_id) : null,
    is_public: data.is_public,
    thumbnail_url: null,
    image_paths: uploadedImages.map(img => img.path),
    tags:
      selectedTags.length > 0 ? (selectedTags.map(id => Number(id)) as number[]) : undefined,
  }
}

/**
 * 将API数据转换为表单格式
 */
export function transformApiDataToFormData(item: any): ItemFormSchemaType {
  return {
    name: item.name || '',
    description: item.description || '',
    quantity: item.quantity || 1,
    status: item.status || 'active',
    purchase_date: item.purchase_date ? new Date(item.purchase_date) : null,
    expiry_date: item.expiry_date ? new Date(item.expiry_date) : null,
    purchase_price: item.purchase_price || null,
    category_id: item.category_id?.toString() || '',
    area_id: item.spot?.room?.area?.id?.toString() || '',
    room_id: item.spot?.room?.id?.toString() || '',
    spot_id: item.spot_id?.toString() || '',
    is_public: item.is_public || false,
  }
}