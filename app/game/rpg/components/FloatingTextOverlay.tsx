'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'

interface FloatingText {
  id: number
  text: string
  x: number
  y: number
  color: string
  type: 'damage' | 'heal' | 'gold' | 'exp' | 'level_up' | 'item'
}

export function FloatingTextOverlay() {
  const [texts, setTexts] = useState<FloatingText[]>([])
  const combatResult = useGameStore(state => state.combatResult)
  const activeTab = useGameStore(state => state.activeTab)
  const processedResultRef = useRef<any>(null)

  const addFloatingTexts = useCallback((newTexts: FloatingText[]) => {
    setTexts(prev => [...prev, ...newTexts])
    // 自动移除
    setTimeout(() => {
      setTexts(prev => prev.filter(t => !newTexts.some(n => n.id === t.id)))
    }, 2000)
  }, [])

  useEffect(() => {
    // 避免重复处理相同的战斗结果
    if (!combatResult || processedResultRef.current === combatResult) {
      return
    }
    processedResultRef.current = combatResult

    console.log('[FloatingText] combatResult:', combatResult)
    const newTexts: FloatingText[] = []

    // 伤害数字
    if (combatResult.damage_dealt > 0) {
      console.log('[FloatingText] Adding damage text:', combatResult.damage_dealt)
      newTexts.push({
        id: Date.now(),
        text: `-${combatResult.damage_dealt}`,
        x: Math.random() * 60 + 20,
        y: Math.random() * 20 + 30,
        color: '#ef4444',
        type: 'damage',
      })
    }

    // 胜利
    if (combatResult.victory) {
      if (combatResult.gold_gained > 0) {
        newTexts.push({
          id: Date.now() + 1,
          text: `+${combatResult.gold_gained} 金币`,
          x: Math.random() * 40 + 30,
          y: Math.random() * 20 + 40,
          color: '#eab308',
          type: 'gold',
        })
      }

      if (combatResult.experience_gained > 0) {
        newTexts.push({
          id: Date.now() + 2,
          text: `+${combatResult.experience_gained} 经验`,
          x: Math.random() * 40 + 30,
          y: Math.random() * 20 + 50,
          color: '#22c55e',
          type: 'exp',
        })
      }

      if (combatResult.loot?.item) {
        newTexts.push({
          id: Date.now() + 3,
          text: `获得 ${combatResult.loot.item.definition?.name || '物品'}`,
          x: 50,
          y: 60,
          color: '#a855f7',
          type: 'item',
        })
      }
    }

    if (newTexts.length > 0) {
      // 使用 setTimeout 将 setState 调用推迟到下一个事件循环
      setTimeout(() => addFloatingTexts(newTexts), 0)
    }
  }, [combatResult, addFloatingTexts])

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {activeTab === 'combat' &&
        texts.map(text => (
          <div
            key={text.id}
            className="animate-float-up text-shadow absolute font-bold"
            style={{
              left: `${text.x}%`,
              top: `${text.y}%`,
              color: text.color,
              fontSize: text.type === 'level_up' ? '2rem' : '1.2rem',
            }}
          >
            {text.text}
          </div>
        ))}
    </div>
  )
}
