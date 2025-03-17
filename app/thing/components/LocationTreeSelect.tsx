"use client"

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Home, DoorOpen, MapPin } from 'lucide-react'
import { API_BASE_URL } from '@/configs/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// 定义类型
type LocationType = 'area' | 'room' | 'spot';
type LocationNode = {
  id: string;
  name: string;
  type: LocationType;
  original_id: number;
  parent_id?: number;
  children?: LocationNode[];
  items_count?: number;
};

type LocationTreeSelectProps = {
  onSelect: (type: LocationType, id: number, fullPath: string) => void;
  selectedLocation?: { type: LocationType, id: number };
  className?: string;
}

export default function LocationTreeSelect({ onSelect, selectedLocation, className }: LocationTreeSelectProps) {
  const [tree, setTree] = useState<LocationNode[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  
  // 加载树形结构数据
  useEffect(() => {
    const fetchLocationTree = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/locations/tree`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Accept': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error('获取位置数据失败')
        }
        
        const data = await response.json()
        setTree(data.tree)
        
        // 如果有选中的位置，自动展开其父节点
        if (selectedLocation) {
          const newExpandedNodes = new Set<string>()
          
          if (selectedLocation.type === 'spot') {
            // 找到对应的区域和房间
            data.spots.forEach((spot: any) => {
              if (spot.id === selectedLocation.id) {
                const room = data.rooms.find((r: any) => r.id === spot.room_id)
                if (room) {
                  newExpandedNodes.add(`area_${room.area_id}`)
                  newExpandedNodes.add(`room_${room.id}`)
                }
              }
            })
          } else if (selectedLocation.type === 'room') {
            // 找到对应的区域
            data.rooms.forEach((room: any) => {
              if (room.id === selectedLocation.id) {
                newExpandedNodes.add(`area_${room.area_id}`)
              }
            })
          }
          
          setExpandedNodes(newExpandedNodes)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "发生错误，请重试")
      } finally {
        setLoading(false)
      }
    }
    
    fetchLocationTree()
  }, [selectedLocation])
  
  // 切换节点展开/折叠状态
  const toggleNode = (nodeId: string) => {
    const newExpandedNodes = new Set(expandedNodes)
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId)
    } else {
      newExpandedNodes.add(nodeId)
    }
    setExpandedNodes(newExpandedNodes)
  }
  
  // 获取节点的完整路径
  const getNodePath = (node: LocationNode): string => {
    if (node.type === 'area') {
      return node.name
    }
    
    // 查找父节点
    if (node.type === 'room') {
      const area = tree.find(area => 
        area.children?.some(room => room.id === node.id)
      )
      return area ? `${area.name} > ${node.name}` : node.name
    }
    
    if (node.type === 'spot') {
      for (const area of tree) {
        for (const room of area.children || []) {
          if (room.children?.some(spot => spot.id === node.id)) {
            return `${area.name} > ${room.name} > ${node.name}`
          }
        }
      }
    }
    
    return node.name
  }
  
  // 选择节点
  const handleSelect = (node: LocationNode) => {
    const fullPath = getNodePath(node)
    onSelect(node.type, node.original_id, fullPath)
  }
  
  // 渲染节点图标
  const renderIcon = (type: LocationType) => {
    switch (type) {
      case 'area':
        return <Home className="h-4 w-4 mr-1" />
      case 'room':
        return <DoorOpen className="h-4 w-4 mr-1" />
      case 'spot':
        return <MapPin className="h-4 w-4 mr-1" />
    }
  }
  
  // 判断节点是否被选中
  const isSelected = (node: LocationNode) => {
    return selectedLocation?.type === node.type && selectedLocation?.id === node.original_id
  }
  
  // 渲染树节点
  const renderTreeNode = (node: LocationNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    
    return (
      <div key={node.id} className="select-none">
        <div 
          className={cn(
            "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
            isSelected(node) && "bg-primary text-primary-foreground hover:bg-primary/90",
            level > 0 && "ml-4"
          )}
          onClick={() => handleSelect(node)}
        >
          {hasChildren && (
            <span 
              className="mr-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
          {!hasChildren && <span className="w-4 mr-1"></span>}
          {renderIcon(node.type)}
          <span>{node.name}</span>
          {node.type === 'spot' && node.items_count !== undefined && node.items_count > 0 && (
            <span className="ml-2 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
              {node.items_count}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }
  
  if (loading && tree.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">加载位置数据...</div>
  }
  
  if (tree.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">暂无位置数据</div>
  }
  
  return (
    <div className={cn("border rounded-md p-2 max-h-[300px] overflow-y-auto", className)}>
      {tree.map(node => renderTreeNode(node))}
    </div>
  )
} 