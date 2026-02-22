import { useCallback } from 'react'

/**
 * Generic form state helpers for common input types.
 *
 * Example:
 * const { handleInputChange, handleSelectChange } = useFormHandlers<YourType>(setData)
 */
export function useFormHandlers<T extends Record<string, any>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData(prev => ({ ...prev, [name]: value }))
    },
    [setFormData]
  )

  const handleSelectChange = useCallback(
    (name: keyof T, value: string) => {
      const actualValue = value === 'none' ? '' : value
      setFormData(prev => ({ ...prev, [name]: actualValue }))
    },
    [setFormData]
  )

  const handleSwitchChange = useCallback(
    (name: keyof T, checked: boolean) => {
      setFormData(prev => ({ ...prev, [name]: checked }))
    },
    [setFormData]
  )

  const handleNumberChange = useCallback(
    (name: keyof T, value: number) => {
      setFormData(prev => ({ ...prev, [name]: value }))
    },
    [setFormData]
  )

  return {
    handleInputChange,
    handleSelectChange,
    handleSwitchChange,
    handleNumberChange,
  }
}
