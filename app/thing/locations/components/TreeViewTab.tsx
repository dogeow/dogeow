"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LocationTreeSelect from '../../components/LocationTreeSelect'
import { LocationType } from '../hooks/useLocationManagement'

interface TreeViewTabProps {
  selectedLocation?: { type: LocationType, id: number };
  onLocationSelect: (type: LocationType, id: number, fullPath: string) => void;
}

export default function TreeViewTab({ selectedLocation, onLocationSelect }: TreeViewTabProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>位置树形结构</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationTreeSelect 
            onSelect={onLocationSelect}
            selectedLocation={selectedLocation}
            className="min-h-[400px]"
          />
        </CardContent>
      </Card>
    </div>
  )
} 