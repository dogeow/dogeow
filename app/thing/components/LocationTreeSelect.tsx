"use client"

import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, ChevronDown, Home, DoorOpen, MapPin, FolderPlus, FolderMinus } from 'lucide-react'
import { API_BASE_URL } from '@/configs/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
  const [searchTerm, setSearchTerm] = useState('')
  const [allNodes, setAllNodes] = useState<LocationNode[]>([])
  const [allNodeIds, setAllNodeIds] = useState<string[]>([])
  
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
        
        // 存储所有节点的平面列表，用于搜索
        const flattenNodes: LocationNode[] = []
        const nodeIds: string[] = []
        
        // 递归将树形结构转为平面结构
        const flattenTree = (nodes: LocationNode[]) => {
          nodes.forEach(node => {
            flattenNodes.push(node)
            if (node.children && node.children.length > 0) {
              nodeIds.push(node.id)
              flattenTree(node.children)
            }
          })
        }
        
        flattenTree(data.tree)
        setAllNodes(flattenNodes)
        setAllNodeIds(nodeIds)
        
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
  
  // 过滤搜索结果
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return allNodes
    
    return allNodes.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, allNodes])
  
  // 一键展开所有节点
  const expandAll = () => {
    setExpandedNodes(new Set(allNodeIds))
  }
  
  // 一键收起所有节点
  const collapseAll = () => {
    setExpandedNodes(new Set())
  }
  
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
  
  // 搜索时自动展开匹配节点的父节点
  useEffect(() => {
    if (searchTerm.trim()) {
      const matchingNodes = allNodes.filter(node => 
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      // 获取需要展开的父节点ID
      const parentNodesIds = new Set<string>()
      
      // 为每个匹配节点找到其所有父节点
      matchingNodes.forEach(node => {
        if (node.type === 'spot') {
          // 查找房间和区域
          for (const area of tree) {
            for (const room of area.children || []) {
              if (room.children?.some(spot => spot.id === node.id)) {
                parentNodesIds.add(area.id)
                parentNodesIds.add(room.id)
                break
              }
            }
          }
        } else if (node.type === 'room') {
          // 查找区域
          const area = tree.find(area => 
            area.children?.some(room => room.id === node.id)
          )
          if (area) {
            parentNodesIds.add(area.id)
          }
        }
      })
      
      // 更新展开节点
      setExpandedNodes(parentNodesIds)
    }
  }, [searchTerm, allNodes, tree])
  
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
        return <Home className="h-3 w-3 mr-0.5" />
      case 'room':
        return <DoorOpen className="h-3 w-3 mr-0.5" />
      case 'spot':
        return <MapPin className="h-3 w-3 mr-0.5" />
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
            "flex items-center py-0.5 px-2 rounded-md cursor-pointer hover:bg-muted transition-colors text-sm",
            isSelected(node) && "bg-primary text-primary-foreground hover:bg-primary/90",
            level > 0 && "ml-2"
          )}
          onClick={() => handleSelect(node)}
        >
          {hasChildren && (
            <span 
              className="mr-0.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          )}
          {!hasChildren && <span className="w-3 mr-0.5"></span>}
          {renderIcon(node.type)}
          <span className="truncate">{node.name}</span>
          {node.type === 'spot' && node.items_count !== undefined && node.items_count > 0 && (
            <span className="ml-1 text-xs bg-muted-foreground/20 px-1 py-0.5 rounded-full">
              {node.items_count}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
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
    <div className={cn("border rounded-md p-2 max-h-[200px] overflow-y-auto", className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="icon"
            onClick={expandAll}
            title="展开所有"
            className="h-8 w-8 bg-primary/10 border-primary/20"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={collapseAll}
            title="收起所有"
            className="h-8 w-8 bg-primary/10 border-primary/20"
          >
            <FolderMinus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1">
          <Input
            placeholder="搜索位置..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-1 mt-2">
        {searchTerm.trim() ? (
          filteredNodes.length > 0 ? (
            filteredNodes.map(node => (
              <div 
                key={node.id}
                className={cn(
                  "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-muted transition-colors text-sm",
                  isSelected(node) && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => handleSelect(node)}
              >
                {renderIcon(node.type)}
                <span className="truncate">{node.name}</span>
                <span className="text-xs ml-2 text-muted-foreground">{getNodePath(node)}</span>
              </div>
            ))
          ) : (
            <div className="py-2 text-center text-sm text-muted-foreground">未找到匹配的位置</div>
          )
        ) : (
          tree.map(node => renderTreeNode(node))
        )}
      </div>
    </div>
  )
} 