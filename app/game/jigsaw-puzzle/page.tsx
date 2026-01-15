'use client'

import React, { useState, Suspense } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
// import { useRouter, useSearchParams } from "next/navigation"
import dynamic from 'next/dynamic'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { GameRulesDialog } from '@/components/ui/game-rules-dialog'
import Link from 'next/link'

// 动态导入拼图游戏组件
const JigsawPuzzle = dynamic(() => import('./components/JigsawPuzzle'), {
  ssr: false,
  loading: () => <div className="p-4 text-center">加载游戏中...</div>,
})

// 系统预设图片
const SYSTEM_IMAGES = [
  {
    id: 'bg1',
    name: '风景1',
    url: '/images/backgrounds/F_RIhiObMAA-c8N.jpeg',
    thumbnail: '/images/backgrounds/F_RIhiObMAA-c8N.jpeg',
  },
  {
    id: 'bg3',
    name: '风景2',
    url: '/images/backgrounds/wallhaven-72rd8e_2560x1440-1.webp',
    thumbnail: '/images/backgrounds/wallhaven-72rd8e_2560x1440-1.webp',
  },
  {
    id: 'project1',
    name: '游戏界面',
    url: '/images/projects/game.png',
    thumbnail: '/images/projects/game.png',
  },
  {
    id: 'project2',
    name: '实验室',
    url: '/images/projects/lab.png',
    thumbnail: '/images/projects/lab.png',
  },
  {
    id: 'project3',
    name: '笔记应用',
    url: '/images/projects/note.png',
    thumbnail: '/images/projects/note.png',
  },
]

const DEFAULT_IMAGE = SYSTEM_IMAGES[0]

// 内部游戏组件
function JigsawPuzzleGame() {
  // const router = useRouter()
  // const searchParams = useSearchParams()

  const [selectedImage, setSelectedImage] = useState<string>(DEFAULT_IMAGE.url)
  const [difficulty, setDifficulty] = useState<number>(3)
  const [gameKey, setGameKey] = useState(0)

  // 开始游戏
  const startGame = (imageUrl?: string, level?: number) => {
    if (imageUrl) setSelectedImage(imageUrl)
    if (level) setDifficulty(level)
    setGameKey(prev => prev + 1)
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => {
        const imageUrl = e.target?.result as string
        startGame(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  // 游戏完成处理
  const handleGameComplete = () => {
    alert(`恭喜！你完成了 ${difficulty}×${difficulty} 的拼图！`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-2 py-4">
      <div className="mb-4 flex w-full max-w-6xl items-center justify-between">
        <div className="text-muted-foreground text-sm">
          <Link href="/game" className="hover:text-foreground transition-colors">
            游戏中心
          </Link>
          <span className="mx-1">{'>'}</span>{' '}
          <span className="text-foreground font-medium">传统拼图</span>
        </div>
        <GameRulesDialog
          title="传统拼图游戏规则"
          rules={[
            '将拼图块拖拽到正确的位置',
            '拼图块会自动吸附到正确位置',
            '完成所有拼图块的放置即可获胜',
            '支持触摸拖拽操作',
          ]}
        />
      </div>

      <div className="w-full max-w-6xl space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">拼图难度</span>
            <span className="rounded border px-2 py-1 font-mono text-xs">
              {difficulty}×{difficulty} ({difficulty * difficulty} 块)
            </span>
          </div>
          <Slider
            value={[difficulty]}
            onValueChange={value => startGame(undefined, value[0])}
            min={2}
            max={8}
            step={1}
            className="w-full"
          />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>简单 (2×2)</span>
            <span>中等 (4×4)</span>
            <span>困难 (8×8)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              上传图片
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ImageIcon className="h-4 w-4" />
            系统图片
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {SYSTEM_IMAGES.map(image => {
              const isActive = selectedImage === image.url
              return (
                <button
                  key={image.id}
                  onClick={() => startGame(image.url)}
                  className={`flex flex-col items-center gap-2 rounded-lg border px-2 py-2 transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-border/60 hover:border-primary'
                  }`}
                >
                  <Image
                    src={image.thumbnail}
                    alt={image.name}
                    width={72}
                    height={72}
                    className="rounded-md object-cover"
                  />
                  <span className="text-muted-foreground text-xs">{image.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="mt-4 w-full max-w-6xl">
          <div key={`game-${gameKey}`}>
            <JigsawPuzzle
              imageUrl={selectedImage}
              size={difficulty}
              onComplete={handleGameComplete}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 主页面组件
export default function JigsawPuzzlePage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">加载中...</div>}>
      <JigsawPuzzleGame />
    </Suspense>
  )
}
