'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { post } from '@/lib/api'

interface PotionSettings {
  autoUseHpPotion: boolean
  hpPotionThreshold: number
  autoUseMpPotion: boolean
  mpPotionThreshold: number
}

interface PotionSettingsResponse {
  character: {
    auto_use_hp_potion: boolean
    hp_potion_threshold: number
    auto_use_mp_potion: boolean
    mp_potion_threshold: number
  }
}

export function PotionSettings() {
  const { inventory, consumePotion, isLoading, character, setCharacter } = useGameStore()
  const [settings, setSettings] = useState<PotionSettings>({
    autoUseHpPotion: character?.auto_use_hp_potion ?? false,
    hpPotionThreshold: character?.hp_potion_threshold ?? 30,
    autoUseMpPotion: character?.auto_use_mp_potion ?? false,
    mpPotionThreshold: character?.mp_potion_threshold ?? 30,
  })
  const [saving, setSaving] = useState(false)

  // 当 character 变化时更新设置
  useEffect(() => {
    if (character) {
      setSettings({
        autoUseHpPotion: character.auto_use_hp_potion ?? false,
        hpPotionThreshold: character.hp_potion_threshold ?? 30,
        autoUseMpPotion: character.auto_use_mp_potion ?? false,
        mpPotionThreshold: character.mp_potion_threshold ?? 30,
      })
    }
  }, [character])

  // 获取药品
  const potions = inventory.filter(item => item.definition.type === 'potion')

  // 更新设置到后端
  const updateSettings = async (newSettings: Partial<PotionSettings>) => {
    setSaving(true)
    try {
      const response = (await post(
        '/rpg/combat/potion-settings',
        newSettings
      )) as PotionSettingsResponse
      setSettings(prev => ({ ...prev, ...newSettings }))
      // 同时更新 store 中的 character 对象
      if (response.character && setCharacter) {
        setCharacter(prev => (prev ? { ...prev, ...response.character } : prev))
      }
    } catch (error) {
      console.error('更新药水设置失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 切换HP药水自动使用
  const toggleHpPotion = () => {
    updateSettings({ autoUseHpPotion: !settings.autoUseHpPotion })
  }

  // 切换MP药水自动使用
  const toggleMpPotion = () => {
    updateSettings({ autoUseMpPotion: !settings.autoUseMpPotion })
  }

  // 更新HP阈值
  const updateHpThreshold = (value: number) => {
    const threshold = Math.min(100, Math.max(1, value))
    updateSettings({ hpPotionThreshold: threshold })
  }

  // 更新MP阈值
  const updateMpThreshold = (value: number) => {
    const threshold = Math.min(100, Math.max(1, value))
    updateSettings({ mpPotionThreshold: threshold })
  }

  // 按恢复量排序药水（高级优先）
  const hpPotions = potions
    .filter(item => item.definition.sub_type === 'hp')
    .sort((a, b) => {
      const aRestore = a.definition.base_stats?.max_hp ?? 0
      const bRestore = b.definition.base_stats?.max_hp ?? 0
      return bRestore - aRestore
    })

  const mpPotions = potions
    .filter(item => item.definition.sub_type === 'mp')
    .sort((a, b) => {
      const aRestore = a.definition.base_stats?.max_mana ?? 0
      const bRestore = b.definition.base_stats?.max_mana ?? 0
      return bRestore - aRestore
    })

  return (
    <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h4 className="text-foreground text-base font-medium sm:text-lg">药品设置</h4>
        {saving && <span className="text-muted-foreground text-xs">保存中...</span>}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* HP药水设置 */}
        <div className="bg-muted/50 border-border rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">自动使用HP药水</span>
            <button
              onClick={toggleHpPotion}
              disabled={saving}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 sm:text-sm ${
                settings.autoUseHpPotion
                  ? 'bg-green-600 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {settings.autoUseHpPotion ? '已开启' : '已关闭'}
            </button>
          </div>

          {settings.autoUseHpPotion && (
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground text-xs sm:text-sm">HP低于</label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.hpPotionThreshold}
                onChange={e => updateHpThreshold(Number(e.target.value))}
                disabled={saving}
                className="border-input bg-muted text-foreground w-20 rounded border px-2 py-1 text-center text-xs disabled:opacity-50 sm:text-sm"
              />
              <span className="text-muted-foreground text-xs">%时自动使用</span>
            </div>
          )}

          <div className="text-muted-foreground mt-2 text-xs">
            拥有HP药水: {hpPotions.reduce((sum, p) => sum + p.quantity, 0)} 个
            {hpPotions.length > 0 && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                (最高恢复 {hpPotions[0].definition.base_stats?.max_hp ?? 0} HP)
              </span>
            )}
          </div>
        </div>

        {/* MP药水设置 */}
        <div className="bg-muted/50 border-border rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">自动使用MP药水</span>
            <button
              onClick={toggleMpPotion}
              disabled={saving}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 sm:text-sm ${
                settings.autoUseMpPotion
                  ? 'bg-green-600 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {settings.autoUseMpPotion ? '已开启' : '已关闭'}
            </button>
          </div>

          {settings.autoUseMpPotion && (
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground text-xs sm:text-sm">MP低于</label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.mpPotionThreshold}
                onChange={e => updateMpThreshold(Number(e.target.value))}
                disabled={saving}
                className="border-input bg-muted text-foreground w-20 rounded border px-2 py-1 text-center text-xs disabled:opacity-50 sm:text-sm"
              />
              <span className="text-muted-foreground text-xs">%时自动使用</span>
            </div>
          )}

          <div className="text-muted-foreground mt-2 text-xs">
            拥有MP药水: {mpPotions.reduce((sum, p) => sum + p.quantity, 0)} 个
            {mpPotions.length > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (最高恢复 {mpPotions[0].definition.base_stats?.max_mana ?? 0} MP)
              </span>
            )}
          </div>
        </div>

        {/* 手动使用药品 */}
        <div className="bg-muted/50 border-border rounded-lg border p-3">
          <h5 className="text-foreground mb-2 text-sm font-medium">手动使用药品</h5>
          <div className="flex flex-wrap gap-2">
            {potions.map(potion => (
              <button
                key={potion.id}
                onClick={() => consumePotion(potion.id)}
                disabled={isLoading}
                className="border-border bg-card hover:border-primary relative flex flex-col items-center rounded border-2 p-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                title={`${potion.definition.name} - 恢复 ${potion.definition.base_stats?.max_hp ?? potion.definition.base_stats?.max_mana ?? 0}`}
              >
                <span className="text-2xl">
                  {potion.definition.sub_type === 'hp' ? '❤️' : '💙'}
                </span>
                <span className="text-muted-foreground mt-1 text-xs">
                  {potion.definition.sub_type === 'hp' ? 'HP' : 'MP'}
                </span>
                {potion.quantity > 1 && (
                  <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold">
                    {potion.quantity}
                  </span>
                )}
              </button>
            ))}
          </div>
          {potions.length === 0 && (
            <p className="text-muted-foreground text-center text-xs">背包中没有药品</p>
          )}
        </div>
      </div>
    </div>
  )
}
