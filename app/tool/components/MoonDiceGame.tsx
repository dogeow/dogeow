'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  compareMoonDiceRank,
  getMoonDiceRankMeta,
  type MoonDiceRank,
  type MoonDiceRankMeta,
} from '../utils/moonDiceRules'

type Player = 'A' | 'B'

interface RoundResult {
  round: number
  dice: number[]
  rank: MoonDiceRank
  meta: MoonDiceRankMeta
}

interface PlayerState {
  name: string
  rounds: RoundResult[]
  score: number
}

const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? ''
const CDN_PREFIX = `${ASSET_BASE}/moon/`

const DICE_COUNT = 6

const generateDice = () =>
  Array.from({ length: DICE_COUNT }, () => Math.floor(Math.random() * 6) + 1)

export default function MoonDiceGame() {
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A')
  const [playerA, setPlayerA] = useState<PlayerState>({
    name: '玩家一',
    rounds: [],
    score: 0,
  })
  const [playerB, setPlayerB] = useState<PlayerState>({
    name: '玩家二',
    rounds: [],
    score: 0,
  })
  const [dice, setDice] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [message, setMessage] = useState<string>('点击 “摇骰子” 开始游戏')
  const timeoutsRef = useRef<number[]>([])

  const currentPlayerState = currentPlayer === 'A' ? playerA : playerB

  const currentRoundNumber = useMemo(() => {
    if (currentPlayer === 'A') return playerA.rounds.length + 1
    return Math.max(1, playerA.rounds.length)
  }, [currentPlayer, playerA.rounds.length])

  const clearTimers = () => {
    timeoutsRef.current.forEach(id => window.clearTimeout(id))
    timeoutsRef.current = []
  }

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [])

  const schedule = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay)
    timeoutsRef.current.push(id)
  }

  const handleRoll = useCallback(() => {
    if (rolling) return

    setRolling(true)
    setMessage(`${currentPlayerState.name} 正在摇骰子…`)
    setDice([])
    clearTimers()

    const finalDice = generateDice()

    finalDice.forEach((value, index) => {
      schedule(() => {
        setDice(prev => {
          const next = [...prev]
          next[index] = value
          return next
        })
      }, index * 300)
    })

    schedule(
      () => {
        const meta = getMoonDiceRankMeta(finalDice)
        const roundResult: RoundResult = {
          round: currentRoundNumber,
          dice: finalDice,
          rank: meta.rank,
          meta,
        }

        if (currentPlayer === 'A') {
          setPlayerA(prev => ({
            ...prev,
            rounds: [...prev.rounds, roundResult],
            score: Number((prev.score + meta.money).toFixed(2)),
          }))
          setMessage(`${playerA.name} 本轮：${meta.name}（${meta.money}），轮到 ${playerB.name} 了`)
          setCurrentPlayer('B')
        } else {
          setPlayerB(prev => ({
            ...prev,
            rounds: [...prev.rounds, roundResult],
            score: Number((prev.score + meta.money).toFixed(2)),
          }))

          const lastARound = playerA.rounds[playerA.rounds.length - 1]
          const compareBase = lastARound ?? null
          let roundMsg = `${playerB.name} 本轮：${meta.name}（${meta.money}）`

          if (compareBase != null) {
            const cmp = compareMoonDiceRank(compareBase.rank, meta.rank)
            if (cmp > 0) {
              roundMsg += `，本轮 ${playerB.name} 赢 🎉`
            } else if (cmp < 0) {
              roundMsg += `，本轮 ${playerA.name} 赢 🎉`
            } else {
              roundMsg += '，本轮平局'
            }
          }

          setMessage(roundMsg)
          setCurrentPlayer('A')
        }

        setRolling(false)
      },
      DICE_COUNT * 300 + 400
    )
  }, [
    rolling,
    currentPlayer,
    currentPlayerState.name,
    currentRoundNumber,
    playerA.name,
    playerA.rounds,
    playerB.name,
  ])

  const handleReset = () => {
    clearTimers()
    setRolling(false)
    setDice([])
    setCurrentPlayer('A')
    setPlayerA({ name: '玩家一', rounds: [], score: 0 })
    setPlayerB({ name: '玩家二', rounds: [], score: 0 })
    setMessage('已重置，点击 “摇骰子” 开始新一局')
  }

  const renderDieImage = (value: number | undefined, index: number) => {
    let fileName = '1.png'

    if (rolling) {
      if (value) {
        fileName = `${value}.gif`
      } else {
        fileName = 'none.gif'
      }
    } else if (value) {
      fileName = `${value}.gif`
    }

    const src = `${CDN_PREFIX}${fileName}`

    return (
      <Image
        key={index}
        src={src}
        alt={value ? `骰子 ${value}` : '骰子'}
        width={48}
        height={48}
        className="h-12 w-12 rounded-md border bg-white object-contain shadow-sm"
        unoptimized
      />
    )
  }

  const leadingPlayer =
    playerA.score === 0 && playerB.score === 0
      ? null
      : playerA.score > playerB.score
        ? playerA.name
        : playerB.score > playerA.score
          ? playerB.name
          : '平局'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-background/60 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80"
            >
              重置
            </button>
            <button
              type="button"
              onClick={handleRoll}
              disabled={rolling}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {rolling ? '摇骰子中…' : `轮到 ${currentPlayerState.name} 摇骰子`}
            </button>
          </div>
        </div>

        <p className="text-sm text-foreground">{message}</p>

        <div className="flex flex-col gap-4 rounded-lg bg-muted/40 p-3">
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: DICE_COUNT }).map((_, index) =>
              renderDieImage(dice[index], index)
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { key: 'A', state: playerA },
            { key: 'B', state: playerB },
          ].map(({ key, state }) => (
            <div
              key={key}
              className={`space-y-2 rounded-lg border p-3 ${
                currentPlayer === key ? 'border-primary/60 bg-primary/5' : 'bg-muted/30'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {key === 'A' ? '玩家一' : '玩家二'}
                  </span>
                  {currentPlayer === key && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      当前出手
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  总额：<span className="font-semibold text-foreground">{state.score}</span>
                </div>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto text-xs">
                {state.rounds.length === 0 ? (
                  <p className="text-muted-foreground/80">暂时还没有记录</p>
                ) : (
                  state.rounds
                    .slice()
                    .reverse()
                    .map(round => (
                      <div
                        key={`${state.name}-${round.round}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-background/60 px-2 py-1"
                      >
                        <span className="text-[11px] text-muted-foreground">
                          第 {round.round} 轮
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-foreground">
                            {round.dice.join(' ')}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {round.meta.name}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {leadingPlayer == null ? (
            <span>还没有分出高下，多摇几轮试试～</span>
          ) : leadingPlayer === '平局' ? (
            <span>双方总分目前打平。</span>
          ) : (
            <span>
              目前整体更旺的是：
              <span className="font-semibold text-foreground">{leadingPlayer}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
