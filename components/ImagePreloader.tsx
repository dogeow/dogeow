import { useEffect } from 'react'

interface ImagePreloaderProps {
  images: string[]
  onAllLoaded?: () => void
}

export const ImagePreloader = ({ images, onAllLoaded }: ImagePreloaderProps) => {
  useEffect(() => {
    if (images.length === 0) {
      onAllLoaded?.()
      return
    }

    let loaded = 0

    // 预加载关键图片
    images.forEach(src => {
      const img = new Image()
      img.onload = () => {
        loaded++
        if (loaded === images.length) {
          onAllLoaded?.()
        }
      }
      img.onerror = () => {
        loaded++
        if (loaded === images.length) {
          onAllLoaded?.()
        }
      }
      img.src = src
    })
  }, [images, onAllLoaded])

  return null
}
