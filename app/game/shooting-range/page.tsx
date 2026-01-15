'use client'

import { Suspense, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GameRulesDialog } from '@/components/ui/game-rules-dialog'
import Link from 'next/link'

// 动态导入ThreeJS组件以避免SSR问题
const ShootingGame = dynamic(() => import('./components/ShootingGame'), {
  ssr: false,
  loading: () => <div className="flex h-96 items-center justify-center">加载中...</div>,
})

export default function ShootingRangePage() {
  const [isStarted, setIsStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')

  // 防止空格键引起页面滚动
  useEffect(() => {
    const preventSpacebarScroll = (e: KeyboardEvent) => {
      // 如果按下空格键
      if (e.code === 'Space' || e.key === ' ') {
        // 阻止默认行为（滚动）
        e.preventDefault()
        return false
      }
    }

    // 添加事件监听器
    window.addEventListener('keydown', preventSpacebarScroll)

    // 清理函数移除事件监听器
    return () => {
      window.removeEventListener('keydown', preventSpacebarScroll)
    }
  }, [])

  // 处理返回设置按钮点击，确保释放指针锁定 - 暂时未使用
  // const handleBackToSettings = () => {
  //   // 尝试释放指针锁定
  //   if (document.exitPointerLock) {
  //     document.exitPointerLock();
  //   } else if ((document as Document & { mozExitPointerLock?: () => void }).mozExitPointerLock) {
  //     (document as Document & { mozExitPointerLock?: () => void }).mozExitPointerLock?.();
  //   } else if ((document as Document & { webkitExitPointerLock?: () => void }).webkitExitPointerLock) {
  //     (document as Document & { webkitExitPointerLock?: () => void }).webkitExitPointerLock?.();
  //   }
  //
  //   // 设置一个短暂的延迟，确保指针锁释放后再更改状态
  //   setTimeout(() => {
  //     setIsStarted(false);
  //   }, 50);
  // }

  return (
    <div className="flex flex-col items-center px-2 py-4">
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <div className="text-muted-foreground text-sm">
          <Link href="/game" className="hover:text-foreground transition-colors">
            游戏中心
          </Link>
          <span className="mx-1">{'>'}</span>{' '}
          <span className="text-foreground font-medium">射击游戏</span>
        </div>
        <GameRulesDialog
          title="射击游戏规则"
          rules={[
            '使用鼠标移动瞄准目标',
            '点击鼠标左键射击',
            '尽可能快速准确地击中所有目标',
            '按ESC键暂停游戏',
            '游戏时间为60秒',
            '击中目标获得10分',
          ]}
        />
      </div>

      {!isStarted ? (
        <Card className="mx-auto max-w-md p-6">
          <h2 className="mb-4 text-2xl font-semibold">游戏设置</h2>

          <div className="mb-4">
            <h3 className="mb-2 font-medium">难度选择：</h3>
            <div className="flex gap-2">
              <Button
                variant={difficulty === 'easy' ? 'default' : 'outline'}
                onClick={() => setDifficulty('easy')}
              >
                简单
              </Button>
              <Button
                variant={difficulty === 'medium' ? 'default' : 'outline'}
                onClick={() => setDifficulty('medium')}
              >
                中等
              </Button>
              <Button
                variant={difficulty === 'hard' ? 'default' : 'outline'}
                onClick={() => setDifficulty('hard')}
              >
                困难
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={() => setIsStarted(true)}>
            开始游戏
          </Button>
        </Card>
      ) : (
        <div className="relative h-[90vh] w-full">
          <div className="relative h-full w-full overflow-hidden">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">加载游戏中...</div>
              }
            >
              <ShootingGame difficulty={difficulty} setGameStarted={setIsStarted} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}
