import React, { useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import LocationTreeSelect from './LocationTreeSelect'
import { ItemFormData, LocationSelection } from "../types"
import { FORM_PLACEHOLDERS, FORM_LABELS, FORM_VALIDATION } from "../constants/form"
import { useFormHandlers } from "../hooks/useFormHandlers"

interface DetailsSectionProps {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  locationPath: string;
  selectedLocation: LocationSelection;
  onLocationSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => void;
}

const DetailsSection: React.FC<DetailsSectionProps> = ({ 
  formData, 
  setFormData, 
  locationPath, 
  selectedLocation, 
  onLocationSelect 
}) => {
  const { handleInputChange } = useFormHandlers({ setFormData })
  
  const handleDateChange = useCallback((name: keyof ItemFormData, date: Date | null) => {
    setFormData(prev => ({ ...prev, [name]: date }))
  }, [setFormData])

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numericValue = value === '' ? null : parseFloat(value)
    setFormData(prev => ({ ...prev, purchase_price: numericValue }))
  }, [setFormData])

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="purchase_date">{FORM_LABELS.purchase_date}</Label>
            <DatePicker
              date={formData.purchase_date}
              setDate={(date) => handleDateChange('purchase_date', date)}
              placeholder={FORM_PLACEHOLDERS.purchase_date}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="expiry_date">{FORM_LABELS.expiry_date}</Label>
            <DatePicker
              date={formData.expiry_date}
              setDate={(date) => handleDateChange('expiry_date', date)}
              placeholder={FORM_PLACEHOLDERS.expiry_date}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="purchase_price">{FORM_LABELS.purchase_price}</Label>
            <Input
              id="purchase_price"
              name="purchase_price"
              type="number"
              step={FORM_VALIDATION.purchase_price.step}
              min={FORM_VALIDATION.purchase_price.min}
              value={formData.purchase_price !== null ? formData.purchase_price : ''}
              onChange={handlePriceChange}
              placeholder={FORM_PLACEHOLDERS.purchase_price}
            />
          </div>
        </div>
        
        <div>
          <Label className="mb-2 block">{FORM_LABELS.location}</Label>
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