import { useCallback } from 'react'

/**
 * Generic form state helpers for common input types.
 *
 * Example:
 * const { handleInputChange, handleSelectChange } = useFormHandlers<YourType>(setData)
 */
export function useFormHandlers<T extends object>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  const updateField = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      setFormData(prev => ({ ...prev, [name]: value }) as T)
    },
    [setFormData]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      const fieldName = name as keyof T
      updateField(fieldName, value as T[keyof T])
    },
    [updateField]
  )

  const handleSelectChange = useCallback(
    <K extends keyof T>(name: K, value: string) => {
      const actualValue = value === 'none' ? '' : value
      updateField(name, actualValue as T[K])
    },
    [updateField]
  )

  const handleSwitchChange = useCallback(
    <K extends keyof T>(name: K, checked: boolean) => {
      updateField(name, checked as T[K])
    },
    [updateField]
  )

  const handleNumberChange = useCallback(
    <K extends keyof T>(name: K, value: number) => {
      updateField(name, value as T[K])
    },
    [updateField]
  )

  return {
    handleInputChange,
    handleSelectChange,
    handleSwitchChange,
    handleNumberChange,
  }
}
