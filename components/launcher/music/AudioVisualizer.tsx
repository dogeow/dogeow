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
  | 'pulse'

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

// 解析 CSS 颜色为 {r,g,b}
// 支持 #hex, rgb()/rgba(), 现代空格分隔 rgb 语法, hsl(), 以及 CSS 变量或关键字（通过临时元素解析）
const parseCssColor = (css: string) => {
  if (!css) return null
  css = css.trim()

  // hex
  if (css.startsWith('#')) {
    const hex = css.slice(1)
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map(h => h + h)
            .join('')
        : hex
    const bigint = parseInt(full, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return { r, g, b }
  }

  // 直接提取数字（适配逗号和空格分隔，并能处理带 / 的 alpha 值）
  const nums = css.match(/-?[\d.]+%?/g)
  if (nums && (css.startsWith('rgb') || css.startsWith('rgba'))) {
    const r = parseInt(nums[0].replace('%', ''), 10) || 0
    const g = parseInt(nums[1].replace('%', ''), 10) || 0
    const b = parseInt(nums[2].replace('%', ''), 10) || 0
    return { r, g, b }
  }

  // hsl -> rgb 转换
  if (nums && (css.startsWith('hsl') || css.startsWith('hsla'))) {
    const h = parseFloat(nums[0])
    const s = parseFloat(nums[1].replace('%', '')) / 100
    const l = parseFloat(nums[2].replace('%', '')) / 100
    const c = (1 - Math.abs(2 * l - 1)) * s
    const hh = (h / 60) % 6
    const x = c * (1 - Math.abs((hh % 2) - 1))
    let r1 = 0,
      g1 = 0,
      b1 = 0
    if (0 <= hh && hh < 1) {
      r1 = c
      g1 = x
      b1 = 0
    } else if (1 <= hh && hh < 2) {
      r1 = x
      g1 = c
      b1 = 0
    } else if (2 <= hh && hh < 3) {
      r1 = 0
      g1 = c
      b1 = x
    } else if (3 <= hh && hh < 4) {
      r1 = 0
      g1 = x
      b1 = c
    } else if (4 <= hh && hh < 5) {
      r1 = x
      g1 = 0
      b1 = c
    } else {
      r1 = c
      g1 = 0
      b1 = x
    }
    const m = l - c / 2
    const r = Math.round((r1 + m) * 255)
    const g = Math.round((g1 + m) * 255)
    const b = Math.round((b1 + m) * 255)
    return { r, g, b }
  }

  // 最后尝试用浏览器解析（能解析变量、关键字等）
  if (typeof window !== 'undefined') {
    try {
      const el = document.createElement('div')
      el.style.color = css
      el.style.display = 'none'
      document.documentElement.appendChild(el)
      const resolved = getComputedStyle(el).color
      document.documentElement.removeChild(el)
      const m = resolved.match(/rgba?\(([^)]+)\)/)
      if (m) {
        const parts = m[1].split(',').map(p => p.trim())
        const r = parseInt(parts[0], 10) || 0
        const g = parseInt(parts[1], 10) || 0
        const b = parseInt(parts[2], 10) || 0
        return { r, g, b }
      }
    } catch (e) {
      // ignore
    }
  }

  return null
}

// 查找元素或其祖先的第一个非透明背景色
const findNearestBackgroundColor = (el?: HTMLElement | null) => {
  if (typeof window === 'undefined') return ''
  let node: HTMLElement | null = el || document.body
  while (node) {
    try {
      const style = getComputedStyle(node)
      const bg = style.backgroundColor || style.getPropertyValue('--background') || ''
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg
    } catch (e) {
      // ignore and continue
    }
    node = node.parentElement
  }
  return ''
}

// 获取背景色信息并判断是否为浅色主题，优先使用传入元素的最近背景
const getBackgroundInfo = (el?: HTMLElement | null) => {
  if (typeof window === 'undefined') return { r: 0, g: 0, b: 0, isLight: false }

  // 优先检测画布自身或最近的带背景的祖先
  let cssBg = ''
  try {
    cssBg = findNearestBackgroundColor(el) || ''
  } catch (e) {
    cssBg = ''
  }

  // 仍然没有则回退到 prefers-color-scheme
  let rgb = parseCssColor(cssBg)
  if (!rgb) {
    const isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    const fallback = isLight
      ? { r: 255, g: 255, b: 255, isLight: true }
      : { r: 0, g: 0, b: 0, isLight: false }

    if (process && process.env && process.env.NODE_ENV !== 'production') {
      console.debug('[AudioVisualizer] background detect fallback:', {
        cssBg,
        parsed: rgb,
        fallback,
      })
    }

    return fallback
  }

  // 判断亮度（相对亮度）
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  const info = { ...rgb, isLight: luminance > 0.6 }

  if (process && process.env && process.env.NODE_ENV !== 'production') {
    console.debug('[AudioVisualizer] background detect:', { cssBg, parsed: rgb, info })
  }

  return info
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
  const prevTypeRef = useRef<VisualizerType>(type)
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
      vx?: number
      seed?: number
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
        // 使用整数坐标避免子像素渲染导致的缝隙
        const x = Math.round(startX + i * (barWidth + barGap))
        const w = Math.max(1, Math.round(barWidth))
        const hRounded = Math.max(1, Math.round(h))
        const y = Math.round(height - hRounded)

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

        // 绘制柱子：优先使用 roundRect（若支持），否则使用 fillRect（整像素绘制更稳定）
        if (ctx.roundRect) {
          ctx.beginPath()
          ctx.roundRect(x, y, w, hRounded, 2)
          ctx.fill()
        } else {
          ctx.fillRect(x, y, w, hRounded)
        }
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
      const gap = 10
      const totalGap = gap * (barCount6 - 1)
      const availableWidth = Math.max(0, width - totalGap)

      // 分配整数像素宽度，避免子像素缝隙
      const baseW = Math.floor(availableWidth / barCount6)
      let remainder = availableWidth - baseW * barCount6
      const widths: number[] = new Array(barCount6)
        .fill(baseW)
        .map(() => (remainder-- > 0 ? baseW + 1 : baseW))

      const primaryColor = getPrimaryColor()

      let x = 0
      for (let i = 0; i < barCount6; i++) {
        // 使用不同频率段的数据
        const dataIndex = Math.floor((i / barCount6) * dataArray.length)
        const value = dataArray[dataIndex] / 255
        const h = Math.round(value * height * 0.95)

        const w = Math.max(1, widths[i])
        const y = Math.max(0, height - h)

        let fillColor = primaryColor
        if (primaryColor.startsWith('hsl')) {
          const baseColor = primaryColor.replace(')', '')
          fillColor = `${baseColor} / ${0.6 + value * 0.4})`
        }

        ctx.fillStyle = fillColor

        // 绘制宽柱（优先使用 roundRect，否则使用 fillRect）
        if (ctx.roundRect) {
          ctx.beginPath()
          ctx.roundRect(x, y, w, h, 8)
          ctx.fill()
        } else {
          ctx.fillRect(x, y, w, h)
        }

        x += w + gap
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
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barW, h, 12)
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

  // 频谱柱子平滑过渡缓存
  const spectrumSmoothedRef = useRef<Float32Array | null>(null)

  // 绘制频谱图（类似音频编辑器的频谱显示）
  const drawSpectrum = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height)
      const barCountSpectrum = 64
      const gap = 2 // 柱子之间的间距
      const totalGap = gap * (barCountSpectrum - 1)
      const availableWidth = Math.max(0, width - totalGap)

      // 整数像素分配宽度
      const baseW = Math.floor(availableWidth / barCountSpectrum)
      let remainder = availableWidth - baseW * barCountSpectrum
      const widths: number[] = new Array(barCountSpectrum)
        .fill(baseW)
        .map(() => (remainder-- > 0 ? baseW + 1 : baseW))

      // 初始化平滑数据
      if (!spectrumSmoothedRef.current || spectrumSmoothedRef.current.length !== barCountSpectrum) {
        spectrumSmoothedRef.current = new Float32Array(barCountSpectrum)
      }
      const smoothed = spectrumSmoothedRef.current

      // 平滑过渡系数：值越小拖尾越长
      const smoothUp = 0.35
      const smoothDown = 0.12

      let x = 0
      for (let i = 0; i < barCountSpectrum; i++) {
        const dataIndex = Math.floor((i / barCountSpectrum) * dataArray.length)
        const rawValue = Math.max(0, Math.min(1, dataArray[dataIndex] / 255))

        // 平滑处理
        const prev = smoothed[i]
        smoothed[i] =
          rawValue > prev
            ? prev + (rawValue - prev) * smoothUp
            : prev + (rawValue - prev) * smoothDown
        const value = smoothed[i]

        const w = Math.max(1, widths[i])
        const h = Math.max(1, Math.round(value * height * 0.92))
        const y = height - h
        const radius = Math.min(3, w / 2)

        // 渐变色：从底部到顶部，颜色随柱子位置变化
        const hue = (i / barCountSpectrum) * 120 + 200 // 蓝→青→绿色谱
        const gradient = ctx.createLinearGradient(x, y, x, height)
        gradient.addColorStop(0, `hsla(${hue}, 80%, 65%, ${0.7 + value * 0.3})`)
        gradient.addColorStop(0.5, `hsla(${hue + 20}, 70%, 50%, ${0.6 + value * 0.4})`)
        gradient.addColorStop(1, `hsla(${hue + 40}, 60%, 35%, ${0.5 + value * 0.3})`)
        ctx.fillStyle = gradient

        // 绘制带圆角的柱子
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, y, w, h, [radius, radius, 0, 0])
        } else {
          ctx.moveTo(x + radius, y)
          ctx.lineTo(x + w - radius, y)
          ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
          ctx.lineTo(x + w, y + h)
          ctx.lineTo(x, y + h)
          ctx.lineTo(x, y + radius)
          ctx.quadraticCurveTo(x, y, x + radius, y)
        }
        ctx.fill()

        // 顶部高光效果
        if (h > 4) {
          ctx.fillStyle = `hsla(${hue}, 90%, 80%, ${0.3 + value * 0.4})`
          ctx.fillRect(x + 1, y, w - 2, Math.min(3, h * 0.15))
        }

        // 底部倒影（半透明镜像）
        const reflectH = Math.min(h * 0.25, 30)
        if (reflectH > 2) {
          const reflectGrad = ctx.createLinearGradient(x, height, x, height + reflectH)
          reflectGrad.addColorStop(0, `hsla(${hue}, 60%, 50%, ${0.15 * value})`)
          reflectGrad.addColorStop(1, `hsla(${hue}, 60%, 50%, 0)`)
          ctx.fillStyle = reflectGrad
          ctx.fillRect(x, height, w, reflectH)
        }

        x += w + gap
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
      const bg = getBackgroundInfo(canvasRef.current)
      // 开发模式下打印背景检测结果以便调试
      if (process && process.env && process.env.NODE_ENV !== 'production') {
        console.debug('[AudioVisualizer] drawSilk using bg:', bg)
      }
      ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.98)`
      ctx.fillRect(0, 0, width, height)

      const drops = silkPointsRef.current
      const primaryColor = getPrimaryColor()

      const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255
      const bass = dataArray.slice(0, 4).reduce((sum, val) => sum + val, 0) / 4 / 255

      // 固定淡蓝色雨滴
      const baseHue = 210

      // 根据音量生成雨滴，声音越大雨越密 — 减少数量约为原来的 50%
      const baseSpawn = Math.floor(1 + avg * 3)
      const spawnCount =
        Math.random() < 0.3 + avg * 0.7 ? Math.max(0, Math.floor(baseSpawn / 2)) : 0
      for (let i = 0; i < spawnCount && drops.length < 100; i++) {
        // spawn across slightly extended horizontal range so edges receive drops
        const spawnX = (Math.random() - 0.05) * width
        drops.push({
          x: spawnX,
          y: -Math.random() * 20,
          len: 5,
          speed: 4 + Math.random() * 6 + avg * 8,
          alpha: 0.4 + Math.random() * 0.3 + avg * 0.3,
          hue: baseHue + Math.random() * 20 - 10,
          vx: (Math.random() - 0.5) * 0.3, // smaller initial horizontal velocity
          seed: Math.random() * 1000,
        })
      }

      // 更新和绘制雨滴
      const t = performance.now() / 1000
      const windMain = avg * 4 + bass * 2 // base wind magnitude

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        // 计算平滑、低频的局部风（基于每个雨滴的种子和时间），频率低且振幅小
        const localGust = Math.sin((d.seed ?? 0) + t * 0.18 + d.y * 0.003) * (avg * 0.6)
        const localWind = windMain * 0.6 + localGust

        // 平滑追随局部风：使用较小的响应系数减少左右摆动
        const vxPrev = d.vx ?? 0
        const adapt = 0.03
        const jitter = (Math.random() - 0.5) * 0.01 // 很小的随机扰动
        d.vx = vxPrev + (localWind - vxPrev) * adapt + jitter

        // 阻尼，抑制持续摆动
        d.vx *= 0.995

        // 少量概率发生短促的侧风突变（模拟真实阵风，但不频繁）
        if (Math.random() < 0.005 * (avg + 0.2)) {
          d.vx += (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.4)
        }

        d.y += d.speed
        d.x += d.vx

        // 超出屏幕移除（左右两边均判断，给左右边留出缓冲区）
        if (d.y > height + d.len || d.x > width + 40 || d.x < -40) {
          drops.splice(i, 1)
          continue
        }

        // 绘制雨滴线条，根据实际水平速度计算倾斜
        const dx = (d.vx ?? 0) * (d.len / d.speed)
        ctx.beginPath()
        ctx.setLineDash([])
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - dx, d.y - d.len)
        // 根据背景亮暗选择滴色：暗色背景使用偏亮的色彩，浅色背景使用较深和更低饱和度的色彩
        if (bg.isLight) {
          ctx.strokeStyle = `hsla(${d.hue}, 30%, 25%, ${Math.min(0.9, d.alpha + 0.1)})`
        } else {
          ctx.strokeStyle = `hsla(${d.hue}, 55%, 80%, ${d.alpha})`
        }
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

  // 光环脉冲系统状态
  const pulseRingsRef = useRef<
    Array<{
      radius: number
      maxRadius: number
      alpha: number
      hue: number
      lineWidth: number
      speed: number
    }>
  >([])
  const pulseSmoothedBassRef = useRef(0)
  const pulseSmoothedMidRef = useRef(0)
  const pulseSmoothedHighRef = useRef(0)

  // 绘制光环脉冲效果
  const drawPulse = useCallback(
    (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      // 半透明清除，产生拖尾
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const maxR = Math.sqrt(cx * cx + cy * cy) * 1.1
      const rings = pulseRingsRef.current

      // 频段分析
      const len = dataArray.length
      const bassSlice = dataArray.slice(0, Math.floor(len * 0.1))
      const midSlice = dataArray.slice(Math.floor(len * 0.1), Math.floor(len * 0.5))
      const highSlice = dataArray.slice(Math.floor(len * 0.5))

      const bassRaw = bassSlice.reduce((s, v) => s + v, 0) / bassSlice.length / 255
      const midRaw = midSlice.reduce((s, v) => s + v, 0) / midSlice.length / 255
      const highRaw = highSlice.reduce((s, v) => s + v, 0) / highSlice.length / 255

      // 平滑
      pulseSmoothedBassRef.current += (bassRaw - pulseSmoothedBassRef.current) * 0.25
      pulseSmoothedMidRef.current += (midRaw - pulseSmoothedMidRef.current) * 0.2
      pulseSmoothedHighRef.current += (highRaw - pulseSmoothedHighRef.current) * 0.2

      const bass = pulseSmoothedBassRef.current
      const mid = pulseSmoothedMidRef.current
      const high = pulseSmoothedHighRef.current
      const avg = (bass + mid + high) / 3

      // 根据低频节拍生成新环
      const beatThreshold = 0.35
      const spawnChance = bass > beatThreshold ? 0.6 + bass * 0.4 : 0.05 + avg * 0.15
      if (Math.random() < spawnChance && rings.length < 25) {
        const hueBase = 280 + mid * 80 // 紫→粉色域
        rings.push({
          radius: 10 + bass * 30,
          maxRadius: maxR,
          alpha: 0.6 + bass * 0.4,
          hue: hueBase + Math.random() * 40 - 20,
          lineWidth: 1.5 + bass * 4,
          speed: 2 + bass * 6 + Math.random() * 2,
        })
      }

      // 中心呼吸光晕
      const breathR = 40 + bass * 120 + Math.sin(performance.now() / 800) * 15
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, breathR)
      const glowHue = 280 + mid * 60
      glowGrad.addColorStop(0, `hsla(${glowHue}, 80%, 70%, ${0.15 + avg * 0.25})`)
      glowGrad.addColorStop(0.5, `hsla(${glowHue + 20}, 70%, 55%, ${0.08 + avg * 0.12})`)
      glowGrad.addColorStop(1, `hsla(${glowHue + 40}, 60%, 40%, 0)`)
      ctx.fillStyle = glowGrad
      ctx.fillRect(cx - breathR, cy - breathR, breathR * 2, breathR * 2)

      // 更新和绘制圆环
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]
        ring.radius += ring.speed
        // 随扩散变淡变细
        const life = 1 - ring.radius / ring.maxRadius
        ring.alpha = Math.max(0, life * (0.5 + bass * 0.5))
        ring.lineWidth = Math.max(0.3, life * (1.5 + bass * 3))

        if (ring.alpha <= 0.01 || ring.radius >= ring.maxRadius) {
          rings.splice(i, 1)
          continue
        }

        // 主圆环
        ctx.beginPath()
        ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${ring.hue}, 75%, 65%, ${ring.alpha})`
        ctx.lineWidth = ring.lineWidth
        ctx.stroke()

        // 外层辉光（更粗更透明）
        if (ring.alpha > 0.1) {
          ctx.beginPath()
          ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${ring.hue}, 60%, 70%, ${ring.alpha * 0.3})`
          ctx.lineWidth = ring.lineWidth * 3
          ctx.stroke()
        }
      }

      // 高频驱动的微粒点缀（围绕中心散布）
      const dotCount = Math.floor(high * 40)
      for (let i = 0; i < dotCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = 50 + Math.random() * (maxR * 0.5) * avg
        const px = cx + Math.cos(angle) * dist
        const py = cy + Math.sin(angle) * dist
        const dotR = 0.5 + Math.random() * 1.5
        const dotAlpha = 0.2 + Math.random() * 0.4 * high

        ctx.beginPath()
        ctx.arc(px, py, dotR, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${280 + Math.random() * 80}, 70%, 75%, ${dotAlpha})`
        ctx.fill()
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
      analyserNode.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)

      // 切换效果类型时，清空画布残留（脉冲/星空等拖尾效果会留下不透明残留）
      if (prevTypeRef.current !== type) {
        ctx.clearRect(0, 0, width, height)
        prevTypeRef.current = type
      }

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
        case 'pulse':
          drawPulse(ctx, dataArray, width, height)
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
    drawPulse,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-full w-full', className)}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
