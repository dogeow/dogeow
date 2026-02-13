'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'
import { toast } from 'sonner'

const VIDEO_WIDTH = 1280
const VIDEO_HEIGHT = 720

async function translateEnToZh(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|zh`
  )
  const data = (await res.json()) as { responseData?: { translatedText?: string } }
  return data.responseData?.translatedText ?? trimmed
}

export default function WordScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [ocrProgress, setOcrProgress] = useState('')

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('当前浏览器不支持摄像头')
      setHasCameraPermission(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT, facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setHasCameraPermission(true)
    } catch (err) {
      toast.error('无法访问摄像头，请检查权限')
      setHasCameraPermission(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    startCamera()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopCamera()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const handleCapture = useCallback(async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || isCapturing) return

    setIsCapturing(true)
    setOcrProgress('识别中…')
    setRecognizedText('')
    setTranslatedText('')

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')
      ctx.drawImage(video, 0, 0)

      setOcrProgress('正在识别英文…')
      const Tesseract = (await import('tesseract.js')).default
      const {
        data: { text },
      } = await Tesseract.recognize(canvas.toDataURL('image/jpeg', 0.9), 'eng', {
        logger: (m: { status: string; progress?: number }) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`识别中 ${Math.round((m.progress ?? 0) * 100)}%`)
          }
        },
      })

      const cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      setRecognizedText(cleaned)

      if (!cleaned) {
        setOcrProgress('')
        toast.info('未识别到文字，请对准英文再拍')
        setIsCapturing(false)
        return
      }

      setOcrProgress('翻译中…')
      const translation = await translateEnToZh(cleaned)
      setTranslatedText(translation)
      setOcrProgress('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '识别或翻译失败')
      setOcrProgress('')
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing])

  return (
    <PageContainer maxWidth="2xl" className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/word" onClick={stopCamera}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">摄像头扫描</h1>
      </div>

      <p className="text-muted-foreground text-sm">
        对准英文文字拍照，自动识别并翻译成中文（需允许使用摄像头）
      </p>

      {/* 摄像头预览 */}
      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium">实时预览</span>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCameraPermission === false && (
            <div className="bg-muted/50 flex aspect-video items-center justify-center rounded-lg border border-dashed">
              <div className="text-muted-foreground text-center text-sm">
                <p className="mb-2">无法使用摄像头</p>
                <Button variant="outline" size="sm" onClick={startCamera}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
              </div>
            </div>
          )}
          {hasCameraPermission === true && (
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute right-0 bottom-3 left-0 flex justify-center">
                <Button size="lg" onClick={handleCapture} disabled={isCapturing} className="gap-2">
                  {isCapturing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {ocrProgress || '处理中…'}
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      拍照识别
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {hasCameraPermission === null && (
            <div className="bg-muted/50 flex aspect-video items-center justify-center rounded-lg border">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 识别与翻译结果 */}
      {(recognizedText || translatedText) && (
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium">识别与翻译</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {recognizedText && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">识别英文</p>
                <p className="bg-muted/30 rounded-md border p-3 text-sm whitespace-pre-wrap">
                  {recognizedText}
                </p>
              </div>
            )}
            {translatedText && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">中文翻译</p>
                <p className="bg-muted/30 rounded-md border p-3 text-sm whitespace-pre-wrap">
                  {translatedText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
