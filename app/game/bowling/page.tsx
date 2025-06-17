"use client"

import { BowlingGame } from "./components/BowlingGame"

export default function BowlingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎳 保龄球</h1>
          <p className="text-amber-200">
            倾斜设备瞄准，轻击投球按钮发射保龄球
          </p>
        </div>
        <BowlingGame />
      </div>
    </div>
  )
} 