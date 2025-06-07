"use client"

import React, { useState, Suspense } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
// import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Upload, Image as ImageIcon, ChevronRight, Home } from "lucide-react"

// 动态导入拼图游戏组件
const JigsawPuzzle = dynamic(
  () => import("./components/JigsawPuzzle"),
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

// 面包屑导航组件
function Breadcrumb({ gameState, onNavigate, imageSource }: { 
  gameState: 'menu' | 'select-image' | 'playing'
  onNavigate: (state: 'menu' | 'select-image') => void
  imageSource?: 'system' | 'custom'
}) {
  const getBreadcrumbItems = () => {
    const items = [
      { label: '游戏', onClick: () => window.history.back(), isClickable: true },
      { label: '传统拼图', onClick: () => onNavigate('menu'), isClickable: gameState !== 'menu' }
    ]
    
    if (gameState === 'select-image') {
      items.push({ label: '选择图片', onClick: () => {}, isClickable: false })
    } else if (gameState === 'playing') {
      const sourceLabel = imageSource === 'custom' ? '自定义图片' : '系统图片'
      items.push(
        { label: sourceLabel, onClick: () => onNavigate('select-image'), isClickable: true },
        { label: '游戏中', onClick: () => {}, isClickable: false }
      )
    }
    
    return items
  }
  
  const items = getBreadcrumbItems()
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-6">
      <Home className="w-4 h-4" />
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.isClickable ? (
            <button
              onClick={item.onClick}
              className="hover:text-gray-900 transition-colors underline-offset-4 hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// 内部游戏组件
function JigsawPuzzleGame() {
  // const router = useRouter()
  // const searchParams = useSearchParams()
  
  const [gameState, setGameState] = useState<'menu' | 'select-image' | 'playing'>('menu')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [difficulty, setDifficulty] = useState<number>(3)
  const [gameKey, setGameKey] = useState(0)
  const [imageSource, setImageSource] = useState<'system' | 'custom'>('system')
  
  // 开始游戏
  const startGame = (imageUrl: string, level?: number, source: 'system' | 'custom' = 'system') => {
    setSelectedImage(imageUrl)
    if (level) setDifficulty(level)
    setImageSource(source)
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
        startGame(imageUrl, undefined, 'custom')
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
    alert(`恭喜！你完成了 ${difficulty}×${difficulty} 的拼图！`)
  }
  
  return (
    <div className="flex flex-col items-center py-4 px-2 min-h-screen">
      {/* 面包屑导航 */}
      <div className="w-full max-w-6xl">
        <Breadcrumb 
          gameState={gameState} 
          imageSource={imageSource}
          onNavigate={(state) => {
            if (state === 'menu') backToMenu()
            else if (state === 'select-image') backToImageSelect()
          }} 
        />
      </div>
      
      {gameState === 'menu' && (
        <Card className="p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <p className="mb-6 text-gray-600">选择图片来源开始游戏</p>
            
            {/* 难度滑块控制 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">拼图难度</label>
                <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                  {difficulty}×{difficulty} ({difficulty * difficulty} 块)
                </span>
              </div>
              <Slider
                value={[difficulty]}
                onValueChange={(value) => setDifficulty(value[0])}
                min={2}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>简单 (2×2)</span>
                <span>中等 (4×4)</span>
                <span>困难 (8×8)</span>
              </div>
            </div>
            
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
              <li>将拼图块拖拽到正确的位置</li>
              <li>拼图块会自动吸附到正确位置</li>
              <li>完成所有拼图块的放置即可获胜</li>
              <li>支持触摸拖拽操作</li>
            </ul>
          </div>
        </Card>
      )}
      
      {gameState === 'select-image' && (
        <div className="w-full max-w-4xl">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">选择系统图片</h2>
            
            {/* 难度滑块控制 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">拼图难度</label>
                <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                  {difficulty}×{difficulty} ({difficulty * difficulty} 块)
                </span>
              </div>
              <Slider
                value={[difficulty]}
                onValueChange={(value) => setDifficulty(value[0])}
                min={2}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>简单 (2×2)</span>
                <span>中等 (4×4)</span>
                <span>困难 (8×8)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {SYSTEM_IMAGES.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors relative">
                    <Image
                      src={image.thumbnail}
                      alt={image.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="font-medium">{image.name}</p>
                    <Button
                      className="mt-2"
                      onClick={() => startGame(image.url, difficulty, 'system')}
                    >
                      开始游戏 ({difficulty}×{difficulty})
                    </Button>
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
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const imageUrl = event.target?.result as string
                        startGame(imageUrl, difficulty, 'custom')
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
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
        <div className="w-full max-w-6xl">
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