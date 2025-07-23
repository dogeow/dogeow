'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BasicInfoForm from '@/app/thing/components/BasicInfoForm'
import TagsSection from '@/app/thing/components/TagsSection'
import ImageSection from '@/app/thing/components/ImageSection'
import DetailsSection from '@/app/thing/components/DetailsSection'
import AutoSaveStatus from '@/app/thing/components/AutoSaveStatus'
import LoadingState from '@/app/thing/components/LoadingState'
import { useItemEdit } from '@/app/thing/hooks/useItemEdit'

export default function EditItem() {
  const {
    initialLoading,
    formData,
    setFormData,
    uploadedImages,
    setUploadedImages,
    selectedLocation,
    locationPath,
    selectedTags,
    setSelectedTags,
    autoSaving,
    lastSaved,
    categories,
    tags,
    handleLocationSelect,
    handleTagCreated,
    router,
  } = useItemEdit()

  if (initialLoading) {
    return <LoadingState onBack={() => router.push('/thing')} />
  }

  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/thing')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">编辑物品</h1>
        </div>

        <AutoSaveStatus autoSaving={autoSaving} lastSaved={lastSaved} />
      </div>

      <div className="pb-20">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="details">详细信息</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <BasicInfoForm formData={formData} setFormData={setFormData} categories={categories} />

            <ImageSection uploadedImages={uploadedImages} setUploadedImages={setUploadedImages} />

            <TagsSection
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              tags={tags}
              onTagCreated={handleTagCreated}
            />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <DetailsSection
              formData={formData}
              setFormData={setFormData}
              locationPath={locationPath}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
