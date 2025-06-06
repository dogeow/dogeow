"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 使用dynamic import避免服务端渲染问题
const NoteEditor = dynamic(
  () => import('../components/NoteEditor'),
  { ssr: false }
)

export default function NewNotePage() {
  // 添加一个加载状态
  const [isLoaded, setIsLoaded] = useState(false)
  
  // 在客户端组件挂载后设置为已加载
  useEffect(() => {
    setIsLoaded(true)
  }, [])
  
  return (
    <div className="container mx-auto py-8">
      {isLoaded && <NoteEditor />}
    </div>
  )
} 