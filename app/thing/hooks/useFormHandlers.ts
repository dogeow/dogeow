import { useCallback } from 'react'
import { ItemFormData } from "../types"

interface UseFormHandlersProps {
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
}

export const useFormHandlers = ({ setFormData }: UseFormHandlersProps) => {
  // 通用输入处理函数
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [setFormData])
  
  // 通用选择处理函数
  const handleSelectChange = useCallback((name: keyof ItemFormData, value: string) => {
    const actualValue = value === "none" ? "" : value;
    setFormData(prev => ({ ...prev, [name]: actualValue }))
  }, [setFormData])
  
  // 通用开关处理函数
  const handleSwitchChange = useCallback((name: keyof ItemFormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }, [setFormData])

  // 通用数值更新函数
  const handleNumberChange = useCallback((name: keyof ItemFormData, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [setFormData])

  return {
    handleInputChange,
    handleSelectChange,
    handleSwitchChange,
    handleNumberChange,
  }
} 