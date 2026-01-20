'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/helpers'

export type VisualizerType = 'bars' | 'wave' | 'waveform' | 'bars6' | 'barSingle' | 'spectrum'

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null
  isPlaying: boolean
  type?: VisualizerType
  className?: string
  barCount?: number
  barWidth?: number
  barGap?: number
  barColor?: string
  showGradient?: boolean
}

// 获取主题色的工具函数
const getPrimaryColor = (): string => {
  if (typeof window !== 'undefined') {
    const style = getComputedStyle(document.documentElement)
    return style.getPropertyValue('--primary').trim() || 'hsl(35 97% 55%)'
  }
  return 'hsl(35 97% 55%)'
}

/**
 * 音频可视化组件
 * 使用 Web Audio API 的 AnalyserNode 实时分析音频频率
 * 支持柱状图、波形、圆形、波形历史轨迹等多种显示模式
 */
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isPlaying,
  type = 'bars6',
  className,
  barCount = 32,
  barWidth = 3,
  barGap = 2,
  barColor = '#3b82f6',
  showGradient = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const waveformHistoryRef = useRef<number[][]>([]) // 存储历史波形数据
  const maxHistoryLength = 200 // 最多保留 200 帧历史数据

  // 初始化数据数组
  useEffect(() => {
    if (analyserNode) {
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount)
    }
  }, [analyserNode])

  // 绘制柱状图
  const drawBars = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      const barCountActual = Math.min(barCount, dataArray.length)
      const totalBarWidth = barCountActual * barWidth + (barCountActual - 1) * barGap
      const startX = (width - totalBarWidth) / 2

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < barCountActual; i++) {
        const value = dataArray[i] / 255
        const h = value * height * 0.9
        const x = startX + i * (barWidth + barGap)
        const y = height - h

        // 渐变色
        if (showGradient) {
          const gradient = ctx.createLinearGradient(x, y, x, height)
          const hue = (i / barCountActual) * 360
          gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`)
          gradient.addColorStop(1, `hsl(${hue + 30}, 70%, 40%)`)
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = barColor
        }

        // 绘制柱子（带圆角）
        ctx.beginPath()
        if ((ctx as any).roundRect) {
          ;(ctx as any).roundRect(x, y, barWidth, h, 2)
        } else {
          // 兼容旧浏览器
          const radius = 2
          ctx.moveTo(x + radius, y)
          ctx.lineTo(x + barWidth - radius, y)
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
          ctx.lineTo(x + barWidth, y + h - radius)
          ctx.quadraticCurveTo(x + barWidth, y + h, x + barWidth - radius, y + h)
          ctx.lineTo(x + radius, y + h)
          ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
          ctx.lineTo(x, y + radius)
          ctx.quadraticCurveTo(x, y, x + radius, y)
          ctx.closePath()
        }
        ctx.fill()
      }
    },
    [barCount, barWidth, barGap, barColor, showGradient]
  )

  // 绘制波形（单帧）
  const drawWave = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height)
      const sliceWidth = width / dataArray.length
      let x = 0

      ctx.beginPath()
      ctx.moveTo(0, height / 2)

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * height) / 2
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        x += sliceWidth
      }

      ctx.lineTo(width, height / 2)

      // 使用主题色绘制轮廓
      const primaryColor = getPrimaryColor()
      let strokeColor = primaryColor
      if (primaryColor.startsWith('hsl')) {
        const baseColor = primaryColor.replace(')', '')
        strokeColor = `${baseColor} / 0.9)`
      }
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.stroke()

      // 填充波形下方区域（使用主题色，透明度较低）
      let fillColor = primaryColor
      if (primaryColor.startsWith('hsl')) {
        const baseColor = primaryColor.replace(')', '')
        fillColor = `${baseColor} / 0.3)`
      }
      ctx.fillStyle = fillColor
      ctx.fill()
    },
    []
  )

  // 绘制波形历史轨迹（波浪形状，下方实心填充，从左到右，动态颜色）
  const drawWaveformHistory = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      const history = waveformHistoryRef.current

      // 将当前帧数据添加到历史（使用频率数据的平均值）
      const currentFrame = Array.from(dataArray).map(val => val / 255)

      // 新数据添加到开头（左侧），旧数据向右移动
      history.unshift(currentFrame)
      // 限制历史长度（根据容器宽度调整）
      const maxFrames = Math.max(maxHistoryLength, Math.floor(width))
      if (history.length > maxFrames) {
        history.pop() // 移除最右边的旧数据
      }

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      // 如果历史数据为空，直接返回
      if (history.length === 0) return

      // 计算每帧的位置（从左到右：索引0是最新数据在左边，最后一个是最旧数据在右边）
      const frameWidth = width / maxFrames // 使用固定宽度，确保滚动效果
      const primaryColor = getPrimaryColor()

      // 创建波浪路径
      ctx.beginPath()
      let pathCreated = false
      const points: Array<{ x: number; y: number; avg: number }> = []

      // 先收集所有点（从最旧到最新，从左到右）
      for (let frameIndex = 0; frameIndex < history.length; frameIndex++) {
        const frame = history[frameIndex]
        const avg = frame.reduce((sum, val) => sum + val, 0) / frame.length
        // 计算波形高度（从底部向上）
        const waveHeight = avg * height * 0.9
        const y = height - waveHeight
        // 从左到右绘制（索引0是最新数据在左边）
        const x = frameIndex * frameWidth

        points.push({ x, y, avg })

        if (!pathCreated) {
          ctx.moveTo(x, y)
          pathCreated = true
        } else {
          // 使用二次贝塞尔曲线创建平滑波浪
          const prevPoint = points[frameIndex - 1]
          const cpX = (prevPoint.x + x) / 2
          const cpY = (prevPoint.y + y) / 2
          ctx.quadraticCurveTo(cpX, cpY, x, y)
        }
      }

      // 闭合路径到底部，形成实心填充
      if (points.length > 0) {
        const lastX = points[points.length - 1].x
        ctx.lineTo(lastX, height)
        ctx.lineTo(0, height)
      } else {
        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
      }
      ctx.closePath()

      // 使用主题色填充（统一颜色，可以有透明度变化）
      let fillColor = primaryColor
      let strokeColor = primaryColor
      if (primaryColor.startsWith('hsl')) {
        const baseColor = primaryColor.replace(')', '')
        fillColor = `${baseColor} / 0.8)`
        strokeColor = `${baseColor} / 0.9)`
      }

      ctx.fillStyle = fillColor
      ctx.fill()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.stroke()
    },
    [maxHistoryLength]
  )

  // 绘制6个柱状图（宽柱）
  const drawBars6 = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height)

      const barCount6 = 6
      const barW = (width - (barCount6 - 1) * 10) / barCount6
      const gap = 10

      const primaryColor = getPrimaryColor()

      for (let i = 0; i < barCount6; i++) {
        // 使用不同频率段的数据
        const dataIndex = Math.floor((i / barCount6) * dataArray.length)
        const value = dataArray[dataIndex] / 255
        const h = value * height * 0.95

        const x = i * (barW + gap)
        const y = height - h

        let fillColor = primaryColor
        if (primaryColor.startsWith('hsl')) {
          const baseColor = primaryColor.replace(')', '')
          fillColor = `${baseColor} / ${0.6 + value * 0.4})`
        }

        ctx.fillStyle = fillColor

        // 绘制宽柱（带圆角）
        ctx.beginPath()
        if ((ctx as any).roundRect) {
          ;(ctx as any).roundRect(x, y, barW, h, 8)
        } else {
          const radius = 8
          ctx.moveTo(x + radius, y)
          ctx.lineTo(x + barW - radius, y)
          ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
          ctx.lineTo(x + barW, y + h - radius)
          ctx.quadraticCurveTo(x + barW, y + h, x + barW - radius, y + h)
          ctx.lineTo(x + radius, y + h)
          ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
          ctx.lineTo(x, y + radius)
          ctx.quadraticCurveTo(x, y, x + radius, y)
          ctx.closePath()
        }
        ctx.fill()
      }
    },
    []
  )

  // 绘制单个大柱状图
  const drawBarSingle = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height)

      // 计算所有频率的平均值
      const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
      const h = (avg / 255) * height * 0.95
      const barW = width * 0.8
      const x = (width - barW) / 2
      const y = height - h

      const primaryColor = getPrimaryColor()
      let fillColor = primaryColor
      if (primaryColor.startsWith('hsl')) {
        const baseColor = primaryColor.replace(')', '')
        fillColor = `${baseColor} / ${0.7 + (avg / 255) * 0.3})`
      }

      ctx.fillStyle = fillColor

      // 绘制大柱（带圆角）
      ctx.beginPath()
      if ((ctx as any).roundRect) {
        ;(ctx as any).roundRect(x, y, barW, h, 12)
      } else {
        const radius = 12
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + barW - radius, y)
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
        ctx.lineTo(x + barW, y + h - radius)
        ctx.quadraticCurveTo(x + barW, y + h, x + barW - radius, y + h)
        ctx.lineTo(x + radius, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
      }
      ctx.fill()
    },
    []
  )

  // 绘制频谱图（类似音频编辑器的频谱显示）
  const drawSpectrum = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height)
      const barCountSpectrum = 64
      const barW = width / barCountSpectrum

      const primaryColor = getPrimaryColor()

      for (let i = 0; i < barCountSpectrum; i++) {
        // 映射到实际数据数组的索引（确保能访问所有数据）
        const dataIndex = Math.floor((i / barCountSpectrum) * dataArray.length)
        const value = Math.max(0, Math.min(1, dataArray[dataIndex] / 255))

        const x = i * barW
        const actualBarWidth = i === barCountSpectrum - 1 ? width - x : barW
        const h = value * height
        const y = height - h

        let fillColor = primaryColor
        if (primaryColor.startsWith('hsl')) {
          const baseColor = primaryColor.replace(')', '')
          fillColor = `${baseColor} / ${0.4 + value * 0.6})`
        }

        ctx.fillStyle = fillColor
        ctx.fillRect(x, y, actualBarWidth, h)
      }
    },
    []
  )

  // 启动/停止动画
  useEffect(() => {
    // 绘制循环函数
    const draw = () => {
      if (!canvasRef.current || !analyserNode || !dataArrayRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 设置 canvas 尺寸，确保完全填满容器
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const displayWidth = Math.ceil(rect.width)
      const displayHeight = Math.ceil(rect.height)

      // 只在尺寸有变化时重设 scale
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr
        canvas.height = displayHeight * dpr
        ctx.setTransform(1, 0, 0, 1, 0, 0) // 重置变换
        ctx.scale(dpr, dpr)
      }

      // 使用精确的宽度和高度，确保完全填满
      const width = displayWidth
      const height = displayHeight
      const dataArray = dataArrayRef.current

      // 获取频率数据
      analyserNode.getByteFrequencyData(dataArray as any)

      // 根据类型绘制
      switch (type) {
        case 'bars':
          drawBars(ctx, dataArray, width, height)
          break
        case 'bars6':
          drawBars6(ctx, dataArray, width, height)
          break
        case 'barSingle':
          drawBarSingle(ctx, dataArray, width, height)
          break
        case 'spectrum':
          drawSpectrum(ctx, dataArray, width, height)
          break
        case 'wave':
          analyserNode.getByteTimeDomainData(dataArray as any) // 波形使用时域数据
          drawWave(ctx, dataArray, width, height)
          break
        case 'waveform':
          // 使用频率数据绘制波形历史轨迹
          drawWaveformHistory(ctx, dataArray, width, height)
          break
      }

      if (isPlaying && analyserNode) {
        animationFrameRef.current = requestAnimationFrame(draw)
      }
    }

    if (isPlaying && analyserNode) {
      draw()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      // 清空画布和历史数据
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
      // 清空历史波形数据
      waveformHistoryRef.current = []
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    isPlaying,
    analyserNode,
    type,
    drawBars,
    drawBars6,
    drawBarSingle,
    drawSpectrum,
    drawWave,
    drawWaveformHistory,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-full w-full', className)}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
