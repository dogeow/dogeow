import { useEffect } from 'react'

interface KeyboardControlsProps {
  movePiece: (direction: 'left' | 'right' | 'down') => boolean
  rotatePiece: () => void
  hardDrop: () => void
  togglePause: () => void
  gameOver: boolean
}

export function useKeyboardControls({
  movePiece,
  rotatePiece,
  hardDrop,
  togglePause,
  gameOver,
}: KeyboardControlsProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          e.preventDefault()
          movePiece('left')
          break
        case 'arrowright':
        case 'd':
          e.preventDefault()
          movePiece('right')
          break
        case 'arrowdown':
        case 's':
          e.preventDefault()
          movePiece('down')
          break
        case 'arrowup':
        case 'w':
        case ' ':
          e.preventDefault()
          if (e.key === ' ') {
            hardDrop()
          } else {
            rotatePiece()
          }
          break
        case 'p':
          e.preventDefault()
          togglePause()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [movePiece, rotatePiece, hardDrop, togglePause, gameOver])
}
