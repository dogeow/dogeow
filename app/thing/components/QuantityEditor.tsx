import React, { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface QuantityEditorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  className?: string
}

const QuantityEditor: React.FC<QuantityEditorProps> = ({
  quantity,
  onQuantityChange,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(quantity.toString())

  // 当外部 quantity 变化时更新 tempQuantity（但只在非编辑状态下）
  useEffect(() => {
    if (!isEditing) {
      setTempQuantity(quantity.toString())
    }
  }, [quantity, isEditing])

  const handleEdit = useCallback(() => {
    setTempQuantity(quantity.toString())
    setIsEditing(true)
  }, [quantity])

  const handleSave = useCallback(() => {
    const newQuantity = parseInt(tempQuantity, 10)
    if (newQuantity > 0 && !isNaN(newQuantity)) {
      onQuantityChange(newQuantity)
      setIsEditing(false)
    }
  }, [tempQuantity, onQuantityChange])

  const handleCancel = useCallback(() => {
    setTempQuantity(quantity.toString())
    setIsEditing(false)
  }, [quantity])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    },
    [handleSave, handleCancel]
  )

  const handleTempQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTempQuantity(e.target.value)
  }, [])

  if (isEditing) {
    return (
      <Input
        type="number"
        min="1"
        value={tempQuantity}
        onChange={handleTempQuantityChange}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={`h-8 w-16 text-center text-sm ${className}`}
        autoFocus
      />
    )
  }

  return (
    <Badge
      variant="secondary"
      className={`hover:bg-secondary/80 cursor-pointer transition-colors ${className}`}
      onClick={handleEdit}
    >
      <span className="text-xs">× {quantity}</span>
    </Badge>
  )
}

export default QuantityEditor
