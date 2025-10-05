declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}

declare module '*.mp3' {
  const content: string
  export default content
}

declare module '*.wav' {
  const content: string
  export default content
}

declare module '*.m4a' {
  const content: string
  export default content
}

declare module '*.aac' {
  const content: string
  export default content
}

declare module '*.ogg' {
  const content: string
  export default content
}

declare module '*.flac' {
  const content: string
  export default content
}

// Media Session API 类型定义
declare global {
  interface Navigator {
    mediaSession?: MediaSession
  }

  interface MediaSession {
    metadata?: MediaMetadata
    playbackState: MediaSessionPlaybackState
    setActionHandler(action: MediaSessionAction, handler: (() => void) | null): void
  }

  interface MediaImage {
    src: string
    sizes?: string
    type?: string
  }

  type MediaSessionAction =
    | 'play'
    | 'pause'
    | 'previoustrack'
    | 'nexttrack'
    | 'seekbackward'
    | 'seekforward'
    | 'seekto'
    | 'stop'

  type MediaSessionPlaybackState = 'none' | 'paused' | 'playing'

  interface MediaMetadataInit {
    title?: string
    artist?: string
    album?: string
    artwork?: MediaImage[]
  }

  class MediaMetadata {
    title?: string
    artist?: string
    album?: string
    artwork?: MediaImage[]
    constructor(init?: MediaMetadataInit)
  }
}
