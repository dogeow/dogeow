'use client'

import { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout'
import AutoSaveStatus from './AutoSaveStatus'

interface ItemFormLayoutProps {
  title: string
  onBack: () => void
  children: {
    basicInfo: ReactNode
    detailInfo: ReactNode
  }
  footer?: ReactNode
  actionButton?: ReactNode
  autoSaving?: boolean
  lastSaved?: Date | null
}

export default function ItemFormLayout({
  title,
  onBack,
  children,
  footer,
  actionButton,
  autoSaving,
  lastSaved,
}: ItemFormLayoutProps) {
  return (
    <PageContainer className="py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {autoSaving !== undefined && lastSaved !== undefined && (
            <AutoSaveStatus autoSaving={autoSaving} lastSaved={lastSaved} />
          )}
          {actionButton}
        </div>
      </div>

      <div className="pb-20">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="details">详细信息</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {children.basicInfo}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {children.detailInfo}
          </TabsContent>
        </Tabs>

        {footer && <div className="mt-6 w-full">{footer}</div>}
      </div>
    </PageContainer>
  )
}
