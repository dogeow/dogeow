'use client'

import { PageContainer } from '@/components/layout'
import { useState } from 'react'

export default function ContactPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('5968251')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <PageContainer maxWidth="4xl">
      <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">联系我们</h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">联系方式</h2>
          <div className="bg-muted rounded-lg p-6">
            <p className="mb-2 text-lg font-medium">QQ号码</p>
            <div className="flex items-center gap-3">
              <code className="bg-background rounded border px-4 py-2 text-xl font-mono">
                5968251
              </code>
              <button
                onClick={handleCopy}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-4 py-2 text-sm font-medium transition-colors"
              >
                {copied ? '已复制 ✓' : '复制号码'}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">回复时间</h2>
          <p className="text-muted-foreground">活跃时间 9:30 - 22:30</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">反馈建议</h2>
          <p className="text-muted-foreground mb-2">
            我们非常重视您的反馈和建议，您的意见将帮助我们不断改进网站功能和用户体验。
          </p>
          <p className="text-muted-foreground">
            欢迎向我们反馈：功能建议、问题报告、使用体验、改进意见等。
          </p>
        </section>
      </div>
    </PageContainer>
  )
}
