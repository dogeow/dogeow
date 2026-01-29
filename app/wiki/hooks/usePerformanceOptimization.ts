import { useState, useCallback, useEffect } from 'react'
import type { NodeData, LinkData } from '../types'

interface PerformanceOptions {
  maxNodesToShow: number
  enableClustering: boolean
  clusterThreshold: number
}

export function usePerformanceOptimization(
  options: PerformanceOptions = {
    maxNodesToShow: 200,
    enableClustering: true,
    clusterThreshold: 50,
  }
) {
  const [performanceOptions, setPerformanceOptions] = useState<PerformanceOptions>(options)
  const [showPerformanceWarning, setShowPerformanceWarning] = useState<boolean>(false)

  const optimizeGraphData = useCallback(
    (nodes: NodeData[], links: LinkData[]) => {
      const { maxNodesToShow, enableClustering, clusterThreshold } = performanceOptions
      let optimizedNodes = [...nodes]
      let optimizedLinks = [...links]

      // 如果节点数量超过阈值，显示警告
      if (nodes.length > maxNodesToShow) {
        setShowPerformanceWarning(true)
      } else {
        setShowPerformanceWarning(false)
      }

      // 如果启用了聚类且节点数量超过阈值，则执行聚类
      if (enableClustering && nodes.length > clusterThreshold) {
        // 这里可以实现节点聚类算法
        // 暂时返回原始数据，但实际应用中可以实现聚类逻辑
        optimizedNodes = nodes.slice(0, maxNodesToShow)
        optimizedLinks = links.filter(link => {
          const sourceId =
            typeof link.source === 'string' || typeof link.source === 'number'
              ? String(link.source)
              : String((link.source as NodeData).id)
          const targetId =
            typeof link.target === 'string' || typeof link.target === 'number'
              ? String(link.target)
              : String((link.target as NodeData).id)

          return (
            optimizedNodes.some(node => String(node.id) === sourceId) &&
            optimizedNodes.some(node => String(node.id) === targetId)
          )
        })
      } else if (nodes.length > maxNodesToShow) {
        // 如果节点太多但未启用聚类，则截取一部分
        optimizedNodes = nodes.slice(0, maxNodesToShow)
        optimizedLinks = links.filter(link => {
          const sourceId =
            typeof link.source === 'string' || typeof link.source === 'number'
              ? String(link.source)
              : String((link.source as NodeData).id)
          const targetId =
            typeof link.target === 'string' || typeof link.target === 'number'
              ? String(link.target)
              : String((link.target as NodeData).id)

          return (
            optimizedNodes.some(node => String(node.id) === sourceId) &&
            optimizedNodes.some(node => String(node.id) === targetId)
          )
        })
      }

      return { nodes: optimizedNodes, links: optimizedLinks }
    },
    [performanceOptions]
  )

  const updatePerformanceOptions = useCallback((newOptions: Partial<PerformanceOptions>) => {
    setPerformanceOptions(prev => ({ ...prev, ...newOptions }))
  }, [])

  return {
    optimizeGraphData,
    performanceOptions,
    updatePerformanceOptions,
    showPerformanceWarning,
  }
}
