'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useItemStore, ItemFormData } from '@/app/thing/stores/itemStore'
import ItemFormWrapper from '../components/forms/ItemFormWrapper'
import { UploadedImage } from '../types'

export default function AddItem() {
  const router = useRouter()
  const { createItem } = useItemStore()

  const handleSubmit = async (
    itemData: ItemFormData,
    selectedTags: string[],
    uploadedImages: UploadedImage[]
  ) => {
    const toast_id = toast.loading('正在创建物品...')
    
    try {
      const newItem = await createItem(itemData)
      toast.success('物品创建成功', { id: toast_id })
      router.push(`/thing/${newItem.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建物品失败', { id: toast_id })
      throw error
    }
  }

  return (
    <ItemFormWrapper
      mode="create"
      title="添加物品"
      onSubmit={handleSubmit}
    />
  )
}
