'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AutoSaveStatus from './AutoSaveStatus'

interface ItemFormLayoutProps {
  title: string
  onBack: () => void
  children: {
    basicInfo: ReactNode
    detailInfo: ReactNode
  }
  footer?: ReactNode
  autoSaving?: boolean
  lastSaved?: Date | null
}

export default function ItemFormLayout({
  title,
  onBack,
  children,
  footer,
  autoSaving,
  lastSaved,
}: ItemFormLayoutProps) {
  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        </div>

        {autoSaving !== undefined && lastSaved !== undefined && (
          <AutoSaveStatus autoSaving={autoSaving} lastSaved={lastSaved} />
        )}
      </div>

      <div className="pb-20">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
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

        {footer && <div className="mt-6 flex justify-end">{footer}</div>}
      </div>
    </div>
  )
}
