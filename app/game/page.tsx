'use client'

import Link from 'next/link'
import { memo } from 'react'
import { Card } from '@/components/ui/card'
import { getTranslatedConfigs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'
import { PageContainer } from '@/components/layout'

// 常量定义
const GAME_CARD_CLASSES = {
  CONTAINER: 'w-26 sm:w-26 lg:w-30 xl:w-30',
  CARD: 'flex aspect-square flex-col items-center justify-center p-3 text-center transition-all hover:-translate-y-1 hover:shadow-md',
  ICON: 'mb-2 text-2xl sm:text-3xl lg:text-4xl',
  TITLE: 'text-sm font-medium sm:text-base lg:text-base',
} as const

// 导入 TranslatableItem 类型
import type { TranslatableItem } from '@/app/configs'

// 游戏类型定义 - 使用 TranslatableItem 但确保 id 存在
interface Game extends Omit<TranslatableItem, 'id'> {
  id: string
}

// 类型守卫函数，确保游戏项有有效的 id
const isValidGame = (item: TranslatableItem): item is Game => {
  return typeof item.id === 'string' && item.id.length > 0
}

// 提取游戏卡片组件
const GameCard = memo(({ game }: { game: Game }) => {
  const cardClassName = `${GAME_CARD_CLASSES.CONTAINER} ${game.hideOnMobile ? 'hidden md:block' : ''}`

  return (
    <Link href={`/game/${game.id}`} key={game.id} className={cardClassName}>
      <Card className={GAME_CARD_CLASSES.CARD}>
        <div
          className={GAME_CARD_CLASSES.ICON}
          role="img"
          aria-label={typeof game.name === 'string' ? game.name : game.id}
        >
          {game.icon}
        </div>
        <h2 className={GAME_CARD_CLASSES.TITLE}>{game.name}</h2>
      </Card>
    </Link>
  )
})

GameCard.displayName = 'GameCard'

export default function GamePage() {
  const { t } = useTranslation()
  const { games: allGames } = getTranslatedConfigs(t)

  // 过滤出有效的游戏（有 id 的游戏）
  const games = allGames.filter(isValidGame)

  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl">
        {/* 页面标题 - 改进SEO */}
        <div className="sr-only">
          <h1>游戏中心</h1>
          <p>包含多种休闲小游戏，如拼图、射击、迷宫等</p>
        </div>

        {/* 游戏网格 */}
        <div
          className="flex flex-wrap justify-start gap-3 sm:gap-4"
          role="grid"
          aria-label="游戏列表"
        >
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
