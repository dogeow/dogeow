'use client'

import { useEffect, useState, useRef } from 'react'
import { useGameStore } from './stores/gameStore'
import { CreateCharacter } from './components/character/CreateCharacter'
import { CharacterSelect } from './components/character/CharacterSelect'
import { CharacterPanel } from './components/character/CharacterPanel'
import { InventoryPanel } from './components/inventory/InventoryPanel'
import { SkillPanel } from './components/skills/SkillPanel'
import { CombatPanel } from './components/combat/CombatPanel'
import { ShopPanel } from './components/shop/ShopPanel'
import { CompendiumPanel } from './components/compendium/CompendiumPanel'
import { SoundSettings } from './components/settings/SoundSettings'
import { PotionSettings } from './components/settings/PotionSettings'
import { FloatingTextOverlay } from './components/shared/FloatingTextOverlay'
import { useCombatWebSocket } from './hooks/useCombatWebSocket'
import useAuthStore from '@/stores/authStore'
import { CopperDisplay } from './components/shared/CopperDisplay'
import { CircularProgress } from './components/shared/CircularProgress'

import './rpg.module.css'

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
    experienceTable,
  } = useGameStore()

  const { isAuthenticated, loading: authLoading } = useAuthStore()
  const [showCreateView, setShowCreateView] = useState(false)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  // 视图由数据派生，避免在 effect 中 setState；首次拉取完成前固定为 select 避免闪屏
  let resolvedView: GameView
  if (!initialFetchDone) {
    resolvedView = 'select'
  } else if (showCreateView) {
    resolvedView = 'create'
  } else if (!characters?.length) {
    resolvedView = 'create'
  } else {
    resolvedView = character ? 'game' : 'select'
  }

  // 优化：所有ref初始化都适当注释
  const loadedCharacterIdRef = useRef<number | null>(null)
  const initializedRef = useRef(false)
  const combatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const executeCombatRef = useRef(executeCombat)
  const startCombatRef = useRef(startCombat)
  const stopCombatRef = useRef(stopCombat)
  const setShouldAutoCombatRef = useRef(setShouldAutoCombat)

  // 每次函数变动都同步对应ref，避免闭包老状态
  useEffect(() => {
    executeCombatRef.current = executeCombat
    startCombatRef.current = startCombat
    stopCombatRef.current = stopCombat
    setShouldAutoCombatRef.current = setShouldAutoCombat
  }, [executeCombat, startCombat, stopCombat, setShouldAutoCombat])

  // 战斗WebSocket注册
  useCombatWebSocket(character?.id ?? null)

  // 自动挂机战斗逻辑，维护自动刷怪定时器
  useEffect(() => {
    if (!combatStats) return

    const hpValue = currentHp ?? combatStats.max_hp ?? 0

    if (hpValue <= 0 && isFighting) {
      stopCombatRef.current()
      setShouldAutoCombatRef.current(false)
      return
    }

    // 自动发起战斗
    if (currentMap && !isFighting && shouldAutoCombat && hpValue > 0) {
      startCombatRef.current()
    }

    // 维护间隔定时器
    if (isFighting && currentMap && shouldAutoCombat) {
      if (!combatIntervalRef.current) {
        // 只启动一次interval
        combatIntervalRef.current = setInterval(async () => {
          await executeCombatRef.current()
        }, 4000)
      }
    } else {
      if (combatIntervalRef.current) {
        clearInterval(combatIntervalRef.current)
        combatIntervalRef.current = null
      }
    }

    // 清理interval
    return () => {
      if (combatIntervalRef.current) {
        clearInterval(combatIntervalRef.current)
        combatIntervalRef.current = null
      }
    }
  }, [isFighting, currentMap, shouldAutoCombat, combatResult, combatStats, currentHp])

  // 认证完成后拉取角色列表；.then 内 setState 为异步，不触发 set-state-in-effect 规则
  useEffect(() => {
    if (authLoading || !isAuthenticated || initializedRef.current) return
    initializedRef.current = true
    fetchCharacters()
      .then(() => setInitialFetchDone(true))
      .catch(() => setInitialFetchDone(true))
  }, [authLoading, isAuthenticated, fetchCharacters])

  // 角色ID变化时批量拉取所有角色相关数据（优化fetch顺序）
  useEffect(() => {
    const characterId = selectedCharacterId || character?.id
    if (characterId && loadedCharacterIdRef.current !== characterId) {
      loadedCharacterIdRef.current = characterId
      fetchCharacter()
      fetchInventory()
      fetchSkills()
      fetchMaps()
      fetchCombatStatus().then(() => {
        const state = useGameStore.getState()
        if (state.isFighting && state.currentMap && !state.shouldAutoCombat) {
          setShouldAutoCombatRef.current(true)
        }
      })
      fetchCombatLogs()
    }
  }, [
    selectedCharacterId,
    character?.id,
    fetchCharacter,
    fetchInventory,
    fetchSkills,
    fetchMaps,
    fetchCombatStatus,
    fetchCombatLogs,
  ])

  // 认证加载中
  if (authLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">初始化中...</p>
        </div>
      </div>
    )
  }

  // 点击角色后正在拉取详情时，先显示加载（避免一直停在选择页）
  if (isLoading && !character) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // 角色选择页面
  if (resolvedView === 'select') {
    return (
      <CharacterSelect
        onBack={() => setShowCreateView(false)}
        onCreateCharacter={() => setShowCreateView(true)}
      />
    )
  }

  // 创建角色
  if (resolvedView === 'create') {
    return (
      <div className="bg-background text-foreground min-h-screen">
        <CreateCharacter onCreateSuccess={() => setShowCreateView(false)} />
      </div>
    )
  }

  // 没有选角，退出
  if (resolvedView !== 'game' || !character) {
    return null
  }

  const handleLogout = () => {
    setShowCreateView(false)
    fetchCharacters()
  }

  const tabs = [
    { id: 'character' as const, name: '角色', icon: '👤' },
    { id: 'inventory' as const, name: '背包', icon: '🎒' },
    { id: 'skills' as const, name: '技能', icon: '✨' },
    { id: 'combat' as const, name: '战斗', icon: '⚔️' },
    { id: 'shop' as const, name: '商店', icon: '🏪' },
    { id: 'compendium' as const, name: '图鉴', icon: '📖' },
    { id: 'settings' as const, name: '设置', icon: '⚙️' },
  ]

  const { expPercent, expToNext } =
    character && experienceTable
      ? (() => {
          const next = experienceTable[character.level + 1] ?? (character.level + 1) * 5000
          const pct = next > 0 ? Math.max(0, Math.min(100, (character.experience / next) * 100)) : 0
          return { expPercent: pct, expToNext: next }
        })()
      : { expPercent: 0, expToNext: 0 }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <FloatingTextOverlay />

      {/* 顶部状态栏 */}
      <header
        className="border-border bg-card fixed right-0 left-0 z-20 border-b px-3 py-2 sm:px-4 sm:py-3"
        style={{ top: 'var(--app-header-height, 50px)' }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {character && combatStats && (
              <div className="flex w-full items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                {/* 左侧：等级、货币 */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground shrink-0 text-xs sm:text-sm">
                    Lv.{character.level}
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    <CopperDisplay copper={character.copper} size="sm" />
                  </span>
                </div>
                {/* 中间：血量/魔量 */}
                <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <CircularProgress
                      percent={
                        combatStats.max_hp > 0
                          ? ((currentHp ?? combatStats.max_hp) / combatStats.max_hp) * 100
                          : 0
                      }
                      color="red"
                    />
                    <span className="text-xs text-red-500 sm:text-sm dark:text-red-400">
                      {currentHp ?? combatStats.max_hp}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CircularProgress
                      percent={
                        combatStats.max_mana > 0
                          ? ((currentMana ?? combatStats.max_mana) / combatStats.max_mana) * 100
                          : 0
                      }
                      color="blue"
                    />
                    <span className="text-xs text-blue-500 sm:text-sm dark:text-blue-400">
                      {currentMana ?? combatStats.max_mana}
                    </span>
                  </div>
                </div>
                {/* 右侧：经验值 */}
                <div className="flex shrink-0">
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {character.experience.toLocaleString()} / {expToNext.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 经验条 1px，紧贴状态栏下方 */}
        {character && (
          <div className="bg-muted absolute right-0 bottom-0 left-0 h-px overflow-hidden">
            <div
              className="h-full min-w-0 transition-[width] duration-300"
              style={{
                width: `${expPercent}%`,
                backgroundColor: expPercent > 0 ? '#f59e0b' : 'transparent',
              }}
            />
          </div>
        )}
      </header>

      {/* 主体内容/导航 */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden px-3 pt-14 pb-3 sm:px-4 sm:pt-16 sm:pb-4">
        <nav className="bg-muted mb-4 hidden gap-1 rounded-lg p-1 lg:flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>

        {error && (
          <div className="border-destructive bg-destructive/20 text-destructive mb-4 rounded-lg border p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-28 lg:pb-4">
          <div className="w-full min-w-0">
            {activeTab === 'character' && <CharacterPanel />}
            {activeTab === 'inventory' && <InventoryPanel />}
            {activeTab === 'skills' && <SkillPanel />}
            {activeTab === 'combat' && <CombatPanel />}
            {activeTab === 'shop' && <ShopPanel />}
            {activeTab === 'compendium' && <CompendiumPanel />}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <PotionSettings />
                <SoundSettings onLogout={handleLogout} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 手机端底部栏 */}
      <nav className="safe-area-bottom border-border bg-card/95 fixed right-0 bottom-0 left-0 border-t backdrop-blur lg:hidden">
        <div className="flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-[64px] flex-1 flex-col items-center justify-center py-3 text-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground hover:text-foreground'
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
