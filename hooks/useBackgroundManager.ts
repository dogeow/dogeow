import { useEffect } from 'react'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { imageAsset } from '@/lib/helpers/assets'

export function resolveBackgroundImageUrl(backgroundImage: string | null | undefined): string {
  if (!backgroundImage) return ''

  if (
    backgroundImage.startsWith('data:') ||
    backgroundImage.startsWith('blob:') ||
    backgroundImage.startsWith('http://') ||
    backgroundImage.startsWith('https://') ||
    backgroundImage.startsWith('//')
  ) {
    return backgroundImage
  }

  if (backgroundImage.startsWith('/')) {
    return backgroundImage
  }

  return imageAsset(`/images/backgrounds/${backgroundImage}`)
}

export const useBackgroundManager = () => {
  const { backgroundImage, setBackgroundImage } = useBackgroundStore()

  useEffect(() => {
    if (!backgroundImage) {
      Object.assign(document.body.style, {
        backgroundImage: '',
        backgroundSize: '',
        backgroundPosition: '',
        backgroundRepeat: '',
        backgroundAttachment: '',
      })
      return
    }

    const imageUrl = resolveBackgroundImageUrl(backgroundImage)

    if (imageUrl) {
      Object.assign(document.body.style, {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      })
    }
  }, [backgroundImage])

  return { backgroundImage, setBackgroundImage }
}
