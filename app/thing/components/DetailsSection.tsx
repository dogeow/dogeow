import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import LocationTreeSelect from './LocationTreeSelect'
import { ItemFormData, LocationSelection } from "../types"

interface DetailsSectionProps {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  locationPath: string;
  selectedLocation: LocationSelection;
  onLocationSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath: string) => void;
}

const DetailsSection: React.FC<DetailsSectionProps> = ({ 
  formData, 
  setFormData, 
  locationPath, 
  selectedLocation, 
  onLocationSelect 
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleDateChange = (name: string, date: Date | null) => {
    setFormData(prev => ({ ...prev, [name]: date }))
  }

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchase_date">购买日期</Label>
            <DatePicker
              date={formData.purchase_date}
              setDate={(date) => handleDateChange('purchase_date', date)}
              placeholder="选择日期"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiry_date">过期日期</Label>
            <DatePicker
              date={formData.expiry_date}
              setDate={(date) => handleDateChange('expiry_date', date)}
              placeholder="选择日期"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase_price">购买价格</Label>
            <Input
              id="purchase_price"
              name="purchase_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.purchase_price}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <Label className="mb-2 block">存放位置</Label>
          <LocationTreeSelect
            onSelect={onLocationSelect}
            selectedLocation={selectedLocation}
          />
          {locationPath && (
            <p className="text-sm text-muted-foreground mt-2">
              当前位置: {locationPath}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default DetailsSection 