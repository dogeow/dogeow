import { ComponentType } from "react"
import TimeConverter from "./components/TimeConverter"

// 工具类别定义
export type ToolCategory = 
  | "日期时间" 
  | "文本处理" 
  | "编码转换" 
  | "格式化" 
  | "计算工具" 
  | "网络工具" 
  | "开发辅助" 
  | "其他"

// 工具接口定义
export interface Tool {
  id: string
  title: string
  description: string
  component: ComponentType
  category: ToolCategory
  tags: string[]
  icon?: string
}

// 所有工具列表
export const tools: Tool[] = [
  {
    id: "time-converter",
    title: "时间转换器",
    description: "时间戳与日期时间相互转换",
    component: TimeConverter,
    category: "日期时间",
    tags: ["时间戳", "日期", "转换"],
  },
  // 后续可添加更多工具
]

// 获取工具类别列表
export const getCategories = (): ToolCategory[] => {
  return [...new Set(tools.map(tool => tool.category))] as ToolCategory[]
}

// 根据ID获取工具
export const getToolById = (id: string): Tool | undefined => {
  return tools.find(tool => tool.id === id)
}

// 根据类别获取工具
export const getToolsByCategory = (category: ToolCategory): Tool[] => {
  return tools.filter(tool => tool.category === category)
}

// 搜索工具
export const searchTools = (query: string): Tool[] => {
  const lowerQuery = query.toLowerCase()
  return tools.filter(tool => 
    tool.title.toLowerCase().includes(lowerQuery) ||
    tool.description.toLowerCase().includes(lowerQuery) ||
    tool.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
} 