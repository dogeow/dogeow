'use client'

import LoadingState from '@/app/thing/components/LoadingState'
import ItemFormWrapper from '@/app/thing/components/forms/ItemFormWrapper'
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
    handleLocationSelect,
    watchAreaId,
    watchRoomId,
    watchSpotId,
    router,
  } = useItemEdit()

  if (initialLoading) {
    return <LoadingState onBack={() => router.push('/thing')} />
  }

  return (
    <ItemFormWrapper
      mode="edit"
      title="编辑物品"
      formData={formData}
      setFormData={setFormData}
      uploadedImages={uploadedImages}
      selectedTags={selectedTags}
      onUploadedImagesChange={setUploadedImages}
      onSelectedTagsChange={setSelectedTags}
      autoSaving={autoSaving}
      lastSaved={lastSaved}
      locationPath={locationPath}
      selectedLocation={selectedLocation}
      onLocationSelect={handleLocationSelect}
      watchAreaId={watchAreaId}
      watchRoomId={watchRoomId}
      watchSpotId={watchSpotId}
    />
  )
}
