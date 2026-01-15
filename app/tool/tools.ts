import { ComponentType } from 'react'
import TimeConverter from './components/TimeConverter'
import ToolPlaceholder from './components/ToolPlaceholder'

// 工具类别定义
export type ToolCategory =
  | '日期时间'
  | '文本处理'
  | '编码转换'
  | '格式化'
  | '计算工具'
  | '网络工具'
  | '开发辅助'
  | '多媒体'
  | '其他'

// 工具接口定义
export interface Tool {
  id: string
  title: string
  description: string
  component: ComponentType
  category: ToolCategory
  tags: string[]
  icon?: string
  route?: string // 添加路由字段
}

// 所有工具列表
export const tools: Tool[] = [
  {
    id: 'time-converter',
    title: '时间转换器',
    description: '时间戳与日期时间相互转换',
    component: TimeConverter,
    category: '日期时间',
    tags: ['时间戳', '日期', '转换'],
  },
  {
    id: 'world-clock',
    title: '世界时钟',
    description: '查看多个城市的当前时间',
    component: ToolPlaceholder,
    category: '日期时间',
    tags: ['时区', '城市', '时间'],
  },
  {
    id: 'countdown',
    title: '倒计时',
    description: '设置目标时间并倒计时提醒',
    component: ToolPlaceholder,
    category: '日期时间',
    tags: ['倒计时', '提醒', '时间'],
  },
  {
    id: 'timezone-converter',
    title: '时区转换',
    description: '不同地区时间相互换算',
    component: ToolPlaceholder,
    category: '日期时间',
    tags: ['时区', '换算', '时间'],
  },
  {
    id: 'word-counter',
    title: '字数统计',
    description: '统计文本长度、字数与行数',
    component: ToolPlaceholder,
    category: '文本处理',
    tags: ['文本', '统计', '字数'],
  },
  {
    id: 'markdown-preview',
    title: 'Markdown 预览',
    description: 'Markdown 即时预览与导出',
    component: ToolPlaceholder,
    category: '文本处理',
    tags: ['Markdown', '预览', '转换'],
  },
  {
    id: 'base64',
    title: 'Base64 编解码',
    description: '文本与 Base64 互转',
    component: ToolPlaceholder,
    category: '编码转换',
    tags: ['Base64', '编码', '解码'],
  },
  {
    id: 'url-encode',
    title: 'URL 编解码',
    description: 'URL 编码与解码',
    component: ToolPlaceholder,
    category: '编码转换',
    tags: ['URL', '编码', '解码'],
  },
  {
    id: 'json-format',
    title: 'JSON 格式化',
    description: '美化、压缩与校验 JSON',
    component: ToolPlaceholder,
    category: '格式化',
    tags: ['JSON', '格式化', '校验'],
  },
  {
    id: 'sql-format',
    title: 'SQL 格式化',
    description: '格式化 SQL 语句',
    component: ToolPlaceholder,
    category: '格式化',
    tags: ['SQL', '格式化', '语句'],
  },
  {
    id: 'bmi-calculator',
    title: 'BMI 计算器',
    description: '根据身高体重计算 BMI',
    component: ToolPlaceholder,
    category: '计算工具',
    tags: ['BMI', '健康', '计算'],
  },
  {
    id: 'unit-converter',
    title: '单位换算',
    description: '常用单位之间换算',
    component: ToolPlaceholder,
    category: '计算工具',
    tags: ['单位', '换算', '长度'],
  },
  {
    id: 'ip-lookup',
    title: 'IP 查询',
    description: '查询 IP 归属地与信息',
    component: ToolPlaceholder,
    category: '网络工具',
    tags: ['IP', '网络', '查询'],
  },
  {
    id: 'ua-parser',
    title: 'UA 解析',
    description: '解析 User-Agent 信息',
    component: ToolPlaceholder,
    category: '网络工具',
    tags: ['UA', '浏览器', '解析'],
  },
  {
    id: 'regex-tester',
    title: '正则测试',
    description: '正则表达式测试与调试',
    component: ToolPlaceholder,
    category: '开发辅助',
    tags: ['正则', '测试', '调试'],
  },
  {
    id: 'image-compress',
    title: '图片压缩',
    description: '快速压缩图片体积',
    component: ToolPlaceholder,
    category: '多媒体',
    tags: ['图片', '压缩', '多媒体'],
  },
  {
    id: 'random-generator',
    title: '随机数生成',
    description: '生成随机数字或字符串',
    component: ToolPlaceholder,
    category: '其他',
    tags: ['随机', '生成', '工具'],
  },
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
  return tools.filter(
    tool =>
      tool.title.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
