'use client'

import type { ReactNode } from 'react'
import { CopperDisplay } from '../shared/CopperDisplay'
import { GameItem, QUALITY_COLORS, QUALITY_NAMES, STAT_NAMES } from '../../types'
import { getItemDisplayName } from '../../utils/itemUtils'
import { ItemTipIcon } from '@/components/game'
import { ItemSocketIndicators } from './ItemSocketIndicators'

interface InventoryItemDetailCardProps {
  item: GameItem
  onClose: () => void
  footer?: ReactNode
  isLoading?: boolean
  onUnsocketGem?: (socketIndex: number) => void
  showBuyPrice?: boolean
}

export function InventoryItemDetailCard({
  item,
  onClose,
  footer,
  isLoading = false,
  onUnsocketGem,
  showBuyPrice = false,
}: InventoryItemDetailCardProps) {
  return (
    <div className="flex flex-col">
      <div
        className="relative flex gap-3 p-3"
        style={{
          background: `linear-gradient(135deg, ${QUALITY_COLORS[item.quality]}20 0%, ${QUALITY_COLORS[item.quality]}10 100%)`,
          borderBottom: `1px solid ${QUALITY_COLORS[item.quality]}30`,
        }}
      >
        <ItemTipIcon item={item} className="shrink-0 drop-shadow-lg" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h5
                className="min-w-0 text-sm leading-tight font-bold break-words sm:text-base"
                style={{ color: QUALITY_COLORS[item.quality] }}
              >
                {getItemDisplayName(item)}
              </h5>
              <span className="text-xs" style={{ color: QUALITY_COLORS[item.quality] }}>
                {QUALITY_NAMES[item.quality]}
              </span>

              {(item.gems?.length ?? 0) > 0 || (item.sockets != null && item.sockets > 0) ? (
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {item.gems?.map(gem => (
                    <button
                      key={gem.id}
                      onClick={() => onUnsocketGem?.(gem.socket_index)}
                      disabled={isLoading || !onUnsocketGem}
                      className="text-cyan-600 hover:underline disabled:opacity-50 dark:text-cyan-400"
                    >
                      💎 {gem.gemDefinition?.name || '宝石'}
                    </button>
                  ))}
                  <ItemSocketIndicators item={item} size="md" variant="detail" />
                </div>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground ml-1 shrink-0 p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-1 space-y-0.5 text-xs">
            {Object.entries(item.stats || {}).map(([stat, value]) => (
              <p key={stat} className="text-green-600 dark:text-green-400">
                +{value} {STAT_NAMES[stat] || stat}
              </p>
            ))}
            {item.affixes?.map((affix, idx) => (
              <p key={idx} className="text-blue-600 dark:text-blue-400">
                {Object.entries(affix)
                  .map(([key, value]) => `+${value} ${STAT_NAMES[key] || key}`)
                  .join(', ')}
              </p>
            ))}
            <p className="text-muted-foreground">
              需求等级: {item.definition?.required_level ?? '—'}
            </p>
            {showBuyPrice &&
              item.definition?.buy_price != null &&
              item.definition.buy_price > 0 && (
                <p className="text-purple-600 dark:text-purple-400">
                  售价: <CopperDisplay copper={item.definition.buy_price} size="xs" nowrap />
                </p>
              )}
            <p className="text-yellow-600 dark:text-yellow-400">
              卖出:{' '}
              <CopperDisplay
                copper={item.sell_price ?? Math.floor((item.definition?.buy_price ?? 0) / 2)}
                size="xs"
                nowrap
              />
            </p>
          </div>
        </div>
      </div>

      {footer ? (
        <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 border-t p-2.5">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
