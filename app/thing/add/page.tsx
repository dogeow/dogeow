'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { ApiSubmitItemData } from '@/app/thing/types'
import ItemFormWrapper from '../components/forms/ItemFormWrapper'

export default function AddItem() {
  const router = useRouter()
  const { createItem } = useItemStore()

  const handleSubmit = async (itemData: ApiSubmitItemData) => {
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

  return <ItemFormWrapper mode="create" title="添加物品" onSubmit={handleSubmit} />
}
