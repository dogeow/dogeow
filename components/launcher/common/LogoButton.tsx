import React, { memo } from 'react'
import Image from 'next/image'
import Logo from '@/public/80.png'

interface LogoButtonProps {
  onClick: () => void
  className?: string
}

export const LogoButton = memo(
  ({ onClick, className = 'h-10 w-10 cursor-pointer' }: LogoButtonProps) => {
    return (
      <Image src={Logo} alt="apps" width={40} height={40} className={className} onClick={onClick} />
    )
  }
)

LogoButton.displayName = 'LogoButton'
