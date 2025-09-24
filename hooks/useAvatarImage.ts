import { useState, useEffect } from 'react'

interface UseAvatarImageProps {
  seed: string
  fallbackInitials: string
}

export function useAvatarImage({ seed, fallbackInitials }: UseAvatarImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Generate avatar URL
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`

  // Alternative avatar services as fallbacks
  const fallbackUrls = [
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackInitials)}&background=random&color=fff&size=128`,
    `https://robohash.org/${encodeURIComponent(seed)}.png?size=128x128&set=set1`,
  ]

  const [currentUrlIndex, setCurrentUrlIndex] = useState(-1) // -1 means using primary URL

  useEffect(() => {
    setImageError(false)
    setIsLoading(true)
    setCurrentUrlIndex(-1)
  }, [seed])

  const handleImageError = () => {
    console.error('Avatar image failed to load:', getCurrentUrl())
    if (currentUrlIndex < fallbackUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1)
      console.log('Trying fallback URL:', fallbackUrls[currentUrlIndex + 1])
    } else {
      setImageError(true)
      console.log('All avatar URLs failed, showing fallback')
    }
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const getCurrentUrl = () => {
    if (currentUrlIndex === -1) {
      return avatarUrl
    }
    return fallbackUrls[currentUrlIndex]
  }

  return {
    src: imageError ? null : getCurrentUrl(),
    isLoading,
    hasError: imageError,
    onError: handleImageError,
    onLoad: handleImageLoad,
  }
}
