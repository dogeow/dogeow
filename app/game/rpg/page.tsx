'use client'

import { useEffect, useState, useRef } from 'react'
import { useGameStore } from './stores/gameStore'
import { CreateCharacter } from './components/CreateCharacter'
import { CharacterSelect } from './components/CharacterSelect'
import { CharacterPanel } from './components/CharacterPanel'
import { InventoryPanel } from './components/InventoryPanel'
import { SkillPanel } from './components/SkillPanel'
import { MapPanel } from './components/MapPanel'
import { CombatPanel } from './components/CombatPanel'
import { ShopPanel } from './components/ShopPanel'
import { SoundSettings } from './components/SoundSettings'
import { PotionSettings } from './components/PotionSettings'
import { FloatingTextOverlay } from './components/FloatingTextOverlay'
import { useCombatWebSocket } from './hooks/useCombatWebSocket'
import useAuthStore from '@/stores/authStore'

type GameView = 'select' | 'create' | 'game'

export default function RPGGame() {
  const {
    character,
    characters,
    selectedCharacterId,
    activeTab,
    setActiveTab,
    fetchCharacter,
    fetchCharacters,
    fetchInventory,
    fetchSkills,
    fetchMaps,
    fetchCombatStatus,
    fetchCombatLogs,
    isLoading,
    error,
    isFighting,
    shouldAutoCombat,
    currentMap,
    currentHp,
    currentMana,
    executeCombat,
    startCombat,
    stopCombat,
    setShouldAutoCombat,
    combatStats,
    combatResult,
  } = useGameStore()
  const { isAuthenticated, loading: authLoading } = useAuthStore()
  const [currentView, setCurrentView] = useState<GameView>('select')

  // 使用 ref 追踪已经获取过数据的角色 ID，防止重复获取
  const loadedCharacterIdRef = useRef<number | null>(null)
  // 追踪是否已经初始化过
  const initializedRef = useRef(false)
  // 战斗 interval 的 ref - 在页面级别管理，不受标签页切换影响
  const combatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 使用 ref 稳定函数引用，避免 useEffect 因函数重新创建而重复执行
  const executeCombatRef = useRef(executeCombat)
  const startCombatRef = useRef(startCombat)
  const stopCombatRef = useRef(stopCombat)
  const setShouldAutoCombatRef = useRef(setShouldAutoCombat)

  // 更新函数引用
  useEffect(() => {
    executeCombatRef.current = executeCombat
    startCombatRef.current = startCombat
    stopCombatRef.current = stopCombat
    setShouldAutoCombatRef.current = setShouldAutoCombat
  }, [executeCombat, startCombat, stopCombat, setShouldAutoCombat])

  // WebSocket 实时战斗推送 - 只有当角色真正选中时才连接
  useCombatWebSocket(character?.id ? character.id : null)

  // 页面级别的自动挂机战斗逻辑 - 不受标签页切换影响
  useEffect(() => {
    // 如果没有战斗属性，跳过检查
    if (!combatStats) {
      return
    }

    // 检查血量，如果为0则自动停止挂机
    // 使用 store 中的 currentHp，而不是自己计算
    const hpValue = currentHp ?? combatStats?.max_hp ?? 0

    if (hpValue <= 0 && isFighting) {
      console.log('[Page] HP is 0, stopping auto-combat')
      stopCombatRef.current()
      setShouldAutoCombatRef.current(false)
      return
    }

    // 只要选择了地图且应该自动战斗，就自动开始战斗
    if (currentMap && !isFighting && shouldAutoCombat && hpValue > 0) {
      console.log('[Page] Auto-starting combat for map:', currentMap.name)
      startCombatRef.current()
    }

    // 管理定时器
    if (isFighting && currentMap && shouldAutoCombat) {
      // 如果已经有定时器在运行，跳过
      if (combatIntervalRef.current) {
        console.log('[Page] Interval already exists, skipping creation')
      } else {
        console.log('[Page] Starting combat interval')
        // 每3秒执行一次战斗（不立即执行，避免状态更新导致重复创建 interval）
        combatIntervalRef.current = setInterval(async () => {
          console.log('[Page] Executing combat from page-level interval')
          await executeCombatRef.current()
        }, 3000)
      }
    } else {
      // 如果不在战斗或不应该自动战斗，清除定时器
      if (combatIntervalRef.current) {
        console.log('[Page] Clearing combat interval (not in auto-combat mode)')
        clearInterval(combatIntervalRef.current)
        combatIntervalRef.current = null
      }
    }

    // 清理函数：组件卸载时清除定时器
    return () => {
      if (combatIntervalRef.current) {
        console.log('[Page] Cleanup: clearing combat interval')
        clearInterval(combatIntervalRef.current)
        combatIntervalRef.current = null
      }
    }
  }, [isFighting, currentMap, shouldAutoCombat, combatResult, combatStats, currentHp])

  // 初始化：等待认证完成后设置初始视图
  useEffect(() => {
    if (authLoading || !isAuthenticated || initializedRef.current) return
    initializedRef.current = true

    // 获取角色列表来确定初始视图
    fetchCharacters()
      .then(() => {
        const chars = useGameStore.getState().characters
        console.log('[RPG Page] After fetch, characters:', chars?.length)
        if (chars && chars.length > 0) {
          setCurrentView('select')
        } else {
          setCurrentView('create')
        }
      })
      .catch(err => {
        console.error('[RPG Page] fetchCharacters error:', err)
        setCurrentView('create')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated])

  // 根据角色数量决定显示哪个视图
  useEffect(() => {
    if (!characters) return

    if (characters.length > 0) {
      if (!character) {
        setCurrentView('select')
      } else {
        setCurrentView('game')
      }
    } else {
      setCurrentView('create')
    }
  }, [characters, character])

  // 只在角色 ID 变化时获取数据
  useEffect(() => {
    const characterId = selectedCharacterId || character?.id
    console.log('[Page] useEffect triggered:')
    console.log('[Page] - selectedCharacterId:', selectedCharacterId)
    console.log('[Page] - character?.id:', character?.id)
    console.log('[Page] - calculated characterId:', characterId)
    console.log('[Page] - loadedCharacterIdRef:', loadedCharacterIdRef.current)
    if (characterId && loadedCharacterIdRef.current !== characterId) {
      console.log('[Page] Character ID changed, fetching data:', characterId)
      loadedCharacterIdRef.current = characterId
      fetchInventory()
      fetchSkills()
      fetchMaps()
      fetchCombatStatus() // 同步战斗状态
        .then(() => {
          // 刷新页面后，如果角色正在地图上战斗，自动恢复 shouldAutoCombat 状态
          const state = useGameStore.getState()
          if (state.isFighting && state.currentMap && !state.shouldAutoCombat) {
            console.log('[Page] Character is fighting on map, restoring auto-combat state')
            setShouldAutoCombatRef.current(true)
          }
        })
      fetchCombatLogs() // 获取战斗日志
    } else {
      console.log(
        '[Page] Skipping fetch - characterId:',
        characterId,
        'already loaded:',
        loadedCharacterIdRef.current
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacterId, character?.id])

  // 等待认证初始化
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-400">初始化中...</p>
        </div>
      </div>
    )
  }

  // 显示角色选择界面
  if (currentView === 'select') {
    return (
      <CharacterSelect
        onBack={() => setCurrentView('select')}
        onCreateCharacter={() => setCurrentView('create')}
      />
    )
  }

  // 显示创建角色界面
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <CreateCharacter onCreateSuccess={() => setCurrentView('select')} />
      </div>
    )
  }

  // 加载中
  if (isLoading && !character) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  // 游戏主界面
  if (currentView !== 'game' || !character) {
    return null
  }

  const handleLogout = () => {
    setCurrentView('select')
    // 重新获取角色列表
    fetchCharacters()
  }

  const tabs = [
    { id: 'character' as const, name: '角色', icon: '👤' },
    { id: 'inventory' as const, name: '背包', icon: '🎒' },
    { id: 'skills' as const, name: '技能', icon: '✨' },
    { id: 'maps' as const, name: '地图', icon: '🗺️' },
    { id: 'combat' as const, name: '战斗', icon: '⚔️' },
    { id: 'shop' as const, name: '商店', icon: '🏪' },
    { id: 'settings' as const, name: '设置', icon: '⚙️' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* 浮动文字覆盖层 */}
      <FloatingTextOverlay />

      {/* 顶部状态栏 - 移动端优化 */}
      <header className="border-b border-gray-700 bg-gray-800 px-3 py-2 sm:px-4 sm:py-3">
        <div className="mx-auto max-w-6xl">
          {/* 移动端：紧凑布局 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {character && combatStats && (
              <div className="flex flex-1 items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Lv.{character.level}</span>
                  <span className="max-w-[80px] truncate text-green-400 sm:max-w-[120px]">
                    {character.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* 血量 - 使用 currentHp 状态显示实际血量 */}
                  <div className="flex items-center gap-1">
                    <span className="text-red-400">❤</span>
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-700 sm:h-2.5 sm:w-24">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{
                          width: `${Math.max(0, ((currentHp ?? combatStats.max_hp) / combatStats.max_hp) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-red-400 sm:text-sm">
                      {currentHp ?? combatStats.max_hp}
                    </span>
                  </div>
                  {/* 魔法量 - 使用 currentMana 状态显示实际魔法量 */}
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400">✦</span>
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-700 sm:h-2.5 sm:w-24">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: `${Math.max(0, ((currentMana ?? combatStats.max_mana) / combatStats.max_mana) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-blue-400 sm:text-sm">
                      {currentMana ?? combatStats.max_mana}
                    </span>
                  </div>
                </div>
                <span className="text-yellow-400">💰 {character.gold.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 - flex + overflow-hidden 以便背包/仓库等内部可滚动 */}
      <main className="flex max-w-6xl flex-1 flex-col overflow-hidden p-3 sm:p-4">
        {/* 标签导航 - 桌面端显示，移动端隐藏 */}
        <nav className="mb-4 hidden gap-1 rounded-lg bg-gray-800 p-1 lg:flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* 内容区 - 整体可滚动，地图/设置/背包等超出视口时在此区域滚动 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-20 lg:pb-4">
          <div className="w-full min-w-0">
            {activeTab === 'character' && <CharacterPanel />}
            {activeTab === 'inventory' && <InventoryPanel />}
            {activeTab === 'skills' && <SkillPanel />}
            {activeTab === 'maps' && <MapPanel />}
            {activeTab === 'combat' && <CombatPanel />}
            {activeTab === 'shop' && <ShopPanel />}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <PotionSettings />
                <SoundSettings onLogout={handleLogout} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 底部导航（仅移动端） */}
      <nav className="safe-area-bottom fixed right-0 bottom-0 left-0 border-t border-gray-700 bg-gray-800/95 backdrop-blur lg:hidden">
        <div className="flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-[64px] flex-1 flex-col items-center justify-center py-3 text-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700/50 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="mb-1 text-xl">{tab.icon}</div>
              <div className="text-xs">{tab.name}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
