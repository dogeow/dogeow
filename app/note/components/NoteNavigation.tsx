'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, Tag, FolderTree } from 'lucide-react'
import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'
// import { ConfirmDialog } from '@/components/ui/confirm-dialog' // 暂时未使用
import { SaveOptionsDialog } from '@/components/ui/save-options-dialog'

export default function NoteNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { isDirty, setDirty, saveDraft } = useEditorStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // 检查当前路径是否激活 - 暂时未使用
  // const isActive = (href: string, exact = false) => {
  //   if (exact) {
  //     return pathname === href
  //   }
  //   return pathname.startsWith(href)
  // }

  // 统一跳转处理
  const handleNavigate = (href: string) => {
    if (isDirty && (pathname.startsWith('/note/new') || pathname.startsWith('/note/edit'))) {
      setPendingHref(href)
      setShowConfirm(true)
    } else {
      router.push(href)
    }
  }

  const handleConfirm = async () => {
    if (saveDraft) {
      await saveDraft()
    }
    setDirty(false)
    setShowConfirm(false)
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  const handleSave = async () => {
    // 这里需要调用实际的保存函数，但由于我们在导航组件中，
    // 我们只能保存为草稿
    if (saveDraft) {
      await saveDraft()
    }
    setDirty(false)
    setShowConfirm(false)
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  const handleDiscard = () => {
    setDirty(false)
    setShowConfirm(false)
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 relative border-b shadow-sm backdrop-blur">
      <nav className="flex items-center overflow-x-auto px-2 py-2">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => handleNavigate('/note')}>
            <FileText className="mr-2 h-4 w-4" />
            我的笔记
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleNavigate('/note/categories')}>
            <FolderTree className="mr-2 h-4 w-4" />
            分类
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleNavigate('/note/tags')}>
            <Tag className="mr-2 h-4 w-4" />
            标签
          </Button>
        </div>
      </nav>
      <SaveOptionsDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="确认离开"
        description="您有未保存的内容，请选择如何处理："
        onSaveDraft={handleConfirm}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saveDraftText="保存为草稿"
        saveText="保存"
        discardText="放弃保存"
      />
    </div>
  )
}
