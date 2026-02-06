'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/helpers'

export type VisualizerType =
  | 'bars'
  | 'waveform'
  | 'bars6'
  | 'barSingle'
  | 'spectrum'
  | 'particles'
  | 'silk'

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

  // 星空系统状态
  const particlesRef = useRef<
    Array<{
      x: number
      y: number
      z: number
      prevX: number
      prevY: number
    }>
  >([])

  // 雨滴系统状态
  const silkPointsRef = useRef<
    Array<{
      x: number
      y: number
      len: number
      speed: number
      alpha: number
      hue: number
    }>
  >([])

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

      // 降采样使曲线更平滑
      const step = 6
      const points: Array<{ x: number; y: number }> = []
      for (let i = 0; i < dataArray.length; i += step) {
        const v = dataArray[i] / 128.0
        const x = (i / dataArray.length) * width
        const y = (v * height) / 2
        points.push({ x, y })
      }
      points.push({ x: width, y: height / 2 })

      // 用贝塞尔曲线连接，更优雅
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length - 1; i++) {
        const cpx = (points[i].x + points[i + 1].x) / 2
        const cpy = (points[i].y + points[i + 1].y) / 2
        ctx.quadraticCurveTo(points[i].x, points[i].y, cpx, cpy)
      }
      const last = points[points.length - 1]
      ctx.lineTo(last.x, last.y)

      // 使用主题色绘制轮廓
      const primaryColor = getPrimaryColor()
      let strokeColor = primaryColor
      if (primaryColor.startsWith('hsl')) {
        const baseColor = primaryColor.replace(')', '')
        strokeColor = `${baseColor} / 0.9)`
      }
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()

      // 填充波形下方区域
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      let fillColor = primaryColor
      if (primaryColor.startsWith('hsl')) {
        const baseColor = primaryColor.replace(')', '')
        fillColor = `${baseColor} / 0.2)`
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
  // 绘制星空穿越效果
  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.fillRect(0, 0, width, height)

      const stars = particlesRef.current
      const primaryColor = getPrimaryColor()

      const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255
      const bass = dataArray.slice(0, 4).reduce((sum, val) => sum + val, 0) / 4 / 255

      // 根据音量动态调整目标星星数量
      const targetCount = Math.floor(20 + avg * 180)

      // 声音小时减少星星
      while (stars.length > targetCount) {
        stars.pop()
      }

      // 声音大时增加星星
      while (stars.length < targetCount) {
        stars.push({
          x: (Math.random() - 0.5) * width * 2,
          y: (Math.random() - 0.5) * height * 2,
          z: Math.random() * 1000 + 200,
          prevX: 0,
          prevY: 0,
        })
      }

      let baseHue = 35
      if (primaryColor.startsWith('hsl')) {
        const parts = primaryColor.replace(')', '').replace('hsl(', '').split(/\s+/)
        baseHue = parseFloat(parts[0]) || 35
      }

      const cx = width / 2
      const cy = height / 2
      const speed = 1.5 + avg * 10 + bass * 5

      for (const star of stars) {
        // 记录前一帧位置
        star.prevX = (star.x / star.z) * 400 + cx
        star.prevY = (star.y / star.z) * 400 + cy

        // z轴前进
        star.z -= speed

        // 超出范围重置
        if (star.z <= 1) {
          star.x = (Math.random() - 0.5) * width * 2
          star.y = (Math.random() - 0.5) * height * 2
          star.z = 800 + Math.random() * 200
          star.prevX = (star.x / star.z) * 400 + cx
          star.prevY = (star.y / star.z) * 400 + cy
        }

        const sx = (star.x / star.z) * 400 + cx
        const sy = (star.y / star.z) * 400 + cy

        // 距离越近越亮越长
        const depth = 1 - star.z / 1000
        const alpha = depth * (0.4 + avg * 0.6)
        const lineW = depth * (1 + bass * 1.5)

        // 只绘制拖尾线条，不绘制圆形
        ctx.beginPath()
        ctx.moveTo(star.prevX, star.prevY)
        ctx.lineTo(sx, sy)
        ctx.strokeStyle = `hsla(${baseHue + depth * 30}, 65%, ${75 + depth * 20}%, ${alpha})`
        ctx.lineWidth = lineW
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    },
    []
  )

  // 绘制下雨效果
  const drawSilk = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      // 对雨模式使用接近不透明的清除，避免留下多重拖尾线条
      ctx.fillStyle = 'rgba(0, 0, 0, 0.98)'
      ctx.fillRect(0, 0, width, height)

      const drops = silkPointsRef.current
      const primaryColor = getPrimaryColor()

      const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255
      const bass = dataArray.slice(0, 4).reduce((sum, val) => sum + val, 0) / 4 / 255

      // 固定淡蓝色雨滴
      const baseHue = 210

      // 根据音量生成雨滴，声音越大雨越密
      const spawnCount = Math.random() < 0.3 + avg * 0.7 ? Math.floor(1 + avg * 3) : 0
      for (let i = 0; i < spawnCount && drops.length < 100; i++) {
        drops.push({
          x: Math.random() * width,
          y: -Math.random() * 20,
          len: 5,
          speed: 4 + Math.random() * 6 + avg * 8,
          alpha: 0.4 + Math.random() * 0.3 + avg * 0.3,
          hue: baseHue + Math.random() * 20 - 10,
        })
      }

      // 更新和绘制雨滴
      const wind = avg * 4 + bass * 2 // 声音越大风越大，角度越斜
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.y += d.speed
        d.x += wind

        // 超出屏幕移除
        if (d.y > height + d.len || d.x > width + 20) {
          drops.splice(i, 1)
          continue
        }

        // 绘制雨滴线条（带角度）
        const dx = wind * (d.len / d.speed)
        ctx.beginPath()
        ctx.setLineDash([])
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - dx, d.y - d.len)
        ctx.strokeStyle = `hsla(${d.hue}, 55%, 80%, ${d.alpha})`
        ctx.lineWidth = 1
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      // 底部溢射反光效果
      if (avg > 0.15) {
        const gradient = ctx.createLinearGradient(0, height - 30, 0, height)
        gradient.addColorStop(0, `hsla(${baseHue}, 40%, 70%, 0)`)
        gradient.addColorStop(1, `hsla(${baseHue}, 40%, 70%, ${avg * 0.15})`)
        ctx.fillStyle = gradient
        ctx.fillRect(0, height - 30, width, 30)
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
        // 'wave' mode removed per user request
        case 'waveform':
          // 使用频率数据绘制波形历史轨迹
          drawWaveformHistory(ctx, dataArray, width, height)
          break
        case 'particles':
          drawParticles(ctx, dataArray, width, height)
          break
        case 'silk':
          drawSilk(ctx, dataArray, width, height)
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
      // 暂停时保留画布内容，不清空
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
    drawParticles,
    drawSilk,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-full w-full', className)}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
