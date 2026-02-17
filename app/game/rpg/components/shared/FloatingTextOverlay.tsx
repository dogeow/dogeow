'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { formatCopper } from '../../types'

interface FloatingText {
  id: number
  text: string
  x: number
  y: number
  color: string
  type: 'damage' | 'heal' | 'gold' | 'exp' | 'level_up' | 'item'
}

const FLOATING_TEXT_DURATION = 2000

// 更清晰的 id 生成器，避免在同一帧内 Date.now() 冲突
let idCounter = 0
function generateId() {
  return Date.now() + idCounter++
}

export function FloatingTextOverlay() {
  const [texts, setTexts] = useState<FloatingText[]>([])
  const combatResult = useGameStore(state => state.combatResult)
  const activeTab = useGameStore(state => state.activeTab)
  const processedResultRef = useRef<any>(null)

  // 通过 useCallback 保证引用稳定，减少不必要渲染
  const addFloatingTexts = useCallback((newTexts: FloatingText[]) => {
    setTexts(prev => [...prev, ...newTexts])
    // 自动移除对应 floating text
    setTimeout(() => {
      setTexts(prev => prev.filter(t => !newTexts.some(n => n.id === t.id)))
    }, FLOATING_TEXT_DURATION)
  }, [])

  useEffect(() => {
    // 避免重复处理相同 combatResult
    if (!combatResult || processedResultRef.current === combatResult) return
    processedResultRef.current = combatResult

    const newTexts: FloatingText[] = []

    // 胜利信息 - 怪物头顶已有伤害显示，这里只显示胜利相关的信息
    if (combatResult.victory) {
      if (combatResult.copper_gained > 0) {
        newTexts.push({
          id: generateId(),
          text: `+${formatCopper(combatResult.copper_gained)}`,
          x: Math.random() * 40 + 30,
          y: Math.random() * 20 + 40,
          color: '#eab308',
          type: 'gold',
        })
      }
      if (combatResult.experience_gained > 0) {
        newTexts.push({
          id: generateId(),
          text: `+${combatResult.experience_gained} 经验`,
          x: Math.random() * 40 + 30,
          y: Math.random() * 20 + 50,
          color: '#22c55e',
          type: 'exp',
        })
      }
      if (combatResult.loot?.item) {
        newTexts.push({
          id: generateId(),
          text: `获得 ${combatResult.loot.item.definition?.name || '物品'}`,
          x: 50,
          y: 60,
          color: '#a855f7',
          type: 'item',
        })
      }
    }

    if (newTexts.length > 0) {
      // 微任务延迟，避免批量状态更新问题
      setTimeout(() => addFloatingTexts(newTexts), 0)
    }
  }, [combatResult, addFloatingTexts])

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {activeTab === 'combat' &&
        texts.map(({ id, text, x, y, color, type }) => (
          <div
            key={id}
            className="animate-float-up text-shadow absolute font-bold select-none"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              color,
              fontSize: type === 'level_up' ? '2rem' : '1.2rem',
              userSelect: 'none',
            }}
            aria-live="polite"
          >
            {text}
          </div>
        ))}
    </div>
  )
}
