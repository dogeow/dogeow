'use client'

import React, { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, ImagePlus, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/helpers'

const writeToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fallback
    }
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

/** 从粘贴的字符串中提取纯 base64 或 data URL */
function parseBase64Input(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/s)
  if (dataUrlMatch) return trimmed
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) return `data:image/png;base64,${trimmed}`
  return null
}

export default function Base64Image() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileBase64, setFileBase64] = useState('')
  const [fileName, setFileName] = useState('')
  const [pasteRaw, setPasteRaw] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [copyBusy, setCopyBusy] = useState(false)

  const handleCopy = useCallback(
    async (text: string) => {
      if (copyBusy || !text) return
      setCopyBusy(true)
      const ok = await writeToClipboard(text)
      setCopyBusy(false)
      if (ok) toast.success('已复制到剪贴板')
      else toast.error('复制失败，请手动复制')
    },
    [copyBusy]
  )

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setFileBase64(result)
      setFileName(file.name)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFileBase64(reader.result as string)
      setFileName(file.name)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handlePasteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setPasteRaw(v)
    const dataUrl = parseBase64Input(v)
    if (dataUrl) {
      setImagePreviewUrl(dataUrl)
    } else {
      setImagePreviewUrl(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="file-to-base64" className="space-y-5">
        <TabsList className="bg-muted/40 grid h-10 w-full grid-cols-2 p-1">
          <TabsTrigger value="file-to-base64" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            文件 → Base64
          </TabsTrigger>
          <TabsTrigger value="base64-to-image" className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Base64 → 图片
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file-to-base64" className="space-y-5">
          <Card className="border-border/60 bg-muted/10">
            <CardContent className="p-4">
              <div
                role="button"
                tabIndex={0}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                className={cn(
                  'border-border/60 flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
                  'hover:border-primary/50 hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                )}
              >
                <p className="text-muted-foreground text-sm">拖放文件到此处，或点击选择文件</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,*/*"
                  onChange={handleFileInput}
                  aria-label="选择文件"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  选择文件
                </Button>
              </div>

              {fileBase64 && (
                <div className="mt-4 space-y-3">
                  {fileName && <p className="text-muted-foreground text-xs">已加载: {fileName}</p>}
                  <div className="flex flex-wrap items-start gap-3">
                    {fileBase64.startsWith('data:image') && (
                      <div className="overflow-hidden rounded-md border border-border/60 bg-muted/30">
                        <Image
                          src={fileBase64}
                          alt="预览"
                          width={192}
                          height={128}
                          unoptimized
                          className="max-h-32 max-w-48 object-contain"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <textarea
                        readOnly
                        className="border-input bg-muted/20 h-32 w-full resize-y rounded-md border px-3 py-2 font-mono text-xs"
                        value={fileBase64}
                        rows={6}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleCopy(fileBase64)}
                        disabled={copyBusy}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        复制 Base64
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="base64-to-image" className="space-y-5">
          <Card className="border-border/60 bg-muted/10">
            <CardContent className="p-4">
              <p className="text-muted-foreground mb-2 text-sm">
                粘贴 Base64 字符串（可带{' '}
                <code className="rounded bg-muted px-1">data:...;base64,</code> 前缀）
              </p>
              <textarea
                className="border-input bg-muted/20 h-32 w-full resize-y rounded-md border px-3 py-2 font-mono text-xs"
                placeholder="data:image/png;base64,iVBORw0KGgo... 或直接粘贴纯 base64"
                value={pasteRaw}
                onChange={handlePasteChange}
                rows={6}
              />
              {imagePreviewUrl && (
                <div className="mt-4 space-y-2">
                  <p className="text-muted-foreground text-xs">预览</p>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="overflow-hidden rounded-md border border-border/60 bg-muted/30">
                      <Image
                        src={imagePreviewUrl}
                        alt="Base64 解码预览"
                        width={400}
                        height={256}
                        unoptimized
                        className="max-h-64 max-w-full object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(pasteRaw.trim())}
                      disabled={copyBusy}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      复制 Base64
                    </Button>
                  </div>
                </div>
              )}
              {pasteRaw.trim() && !imagePreviewUrl && (
                <p className="text-destructive mt-2 text-sm">无法识别为有效的 Base64 图片数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
