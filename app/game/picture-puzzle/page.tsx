"use client"

import React, { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Upload, Image as ImageIcon, ArrowLeft } from "lucide-react"

// 动态导入拼图游戏组件
const PicturePuzzle = dynamic(
  () => import("./components/PicturePuzzle"),
  {
    ssr: false,
    loading: () => <div className="p-4 text-center">加载游戏中...</div>,
  }
)

// 系统预设图片
const SYSTEM_IMAGES = [
  {
    id: 'bg1',
    name: '风景1',
    url: '/images/backgrounds/F_RIhiObMAA-c8N.jpeg',
    thumbnail: '/images/backgrounds/F_RIhiObMAA-c8N.jpeg'
  },
  {
    id: 'bg2', 
    name: '我的世界',
    url: '/images/backgrounds/我的世界.png',
    thumbnail: '/images/backgrounds/我的世界.png'
  },
  {
    id: 'bg3',
    name: '风景2', 
    url: '/images/backgrounds/wallhaven-72rd8e_2560x1440-1.webp',
    thumbnail: '/images/backgrounds/wallhaven-72rd8e_2560x1440-1.webp'
  },
  {
    id: 'project1',
    name: '游戏界面',
    url: '/images/projects/game.png',
    thumbnail: '/images/projects/game.png'
  },
  {
    id: 'project2',
    name: '实验室',
    url: '/images/projects/lab.png',
    thumbnail: '/images/projects/lab.png'
  },
  {
    id: 'project3',
    name: '笔记应用',
    url: '/images/projects/note.png',
    thumbnail: '/images/projects/note.png'
  }
]

// 内部游戏组件
function PicturePuzzleGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [gameState, setGameState] = useState<'menu' | 'select-image' | 'playing'>('menu')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [difficulty, setDifficulty] = useState<3 | 4 | 5>(3)
  const [gameKey, setGameKey] = useState(0)
  
  // 开始游戏
  const startGame = (imageUrl: string, level: 3 | 4 | 5) => {
    setSelectedImage(imageUrl)
    setDifficulty(level)
    setGameState('playing')
    setGameKey(prev => prev + 1)
  }
  
  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setSelectedImage(imageUrl)
        setGameState('playing')
        setGameKey(prev => prev + 1)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 返回菜单
  const backToMenu = () => {
    setGameState('menu')
    setSelectedImage('')
  }
  
  // 返回图片选择
  const backToImageSelect = () => {
    setGameState('select-image')
  }
  
  // 游戏完成处理
  const handleGameComplete = () => {
    alert(`恭喜！你完成了 ${difficulty}×${difficulty} 的图片拼图！`)
  }
  
  return (
    <div className="flex flex-col items-center py-4 px-2 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">图片拼图游戏</h1>
      
      {gameState === 'menu' && (
        <Card className="p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <p className="mb-6 text-gray-600">选择图片来源开始游戏</p>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => setGameState('select-image')}
                variant="default"
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                使用系统图片
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  上传自定义图片
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            <p className="font-medium mb-2">游戏规则：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>将打乱的图片方块移动到正确位置</li>
              <li>点击与空白方块相邻的方块可以移动它</li>
              <li>重新组合完整图片即可获胜</li>
              <li>支持键盘方向键控制</li>
            </ul>
          </div>
        </Card>
      )}
      
      {gameState === 'select-image' && (
        <div className="w-full max-w-4xl">
          <Button 
            variant="outline" 
            onClick={backToMenu}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">选择系统图片</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {SYSTEM_IMAGES.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors">
                    <img
                      src={image.thumbnail}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="font-medium">{image.name}</p>
                    <div className="flex gap-2 mt-2 justify-center">
                      <Button
                        size="sm"
                        onClick={() => startGame(image.url, 3)}
                      >
                        简单 (3×3)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startGame(image.url, 4)}
                      >
                        中等 (4×4)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startGame(image.url, 5)}
                      >
                        困难 (5×5)
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-3">或者上传自定义图片：</p>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  选择文件
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {gameState === 'playing' && selectedImage && (
        <div className="w-full max-w-2xl">
          <div className="flex gap-2 mb-4">
            <Button 
              variant="outline" 
              onClick={backToImageSelect}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              重新选择图片
            </Button>
            <Button 
              variant="outline" 
              onClick={backToMenu}
            >
              返回主菜单
            </Button>
          </div>
          
          <div key={`game-${gameKey}`}>
            <PicturePuzzle 
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
export default function PicturePuzzlePage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">加载中...</div>}>
      <PicturePuzzleGame />
    </Suspense>
  )
} 