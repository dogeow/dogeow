import React, { memo } from 'react'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import type { SelectOption } from '../utils/optionUtils'

interface LocationSelectFieldProps {
  label: string
  options: SelectOption[]
  value: string
  placeholder: string
  emptyText: string
  createText: string
  searchText: string
  disabled?: boolean
  disabledText?: string
  onChange: (value: string) => void
  onCreateOption?: (name: string) => void
}

export const LocationSelectField = memo<LocationSelectFieldProps>(
  ({
    label,
    options,
    value,
    placeholder,
    emptyText,
    createText,
    searchText,
    disabled = false,
    disabledText,
    onChange,
    onCreateOption,
  }) => {
    if (disabled) {
      return (
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-normal">{label}</Label>
          <div className="border-input bg-muted/50 text-muted-foreground flex h-10 items-center rounded-md border px-3 text-sm">
            {disabledText || '请先选择上级选项'}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-normal">{label}</Label>
        <Combobox
          options={options}
          value={value}
          onChange={onChange}
          onCreateOption={onCreateOption}
          placeholder={placeholder}
          emptyText={emptyText}
          createText={createText}
          searchText={searchText}
        />
      </div>
    )
  }
)

LocationSelectField.displayName = 'LocationSelectField'
