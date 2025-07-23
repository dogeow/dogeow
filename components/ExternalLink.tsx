import Link from 'next/link'
import { cn } from '@/lib/helpers'

export const ExternalLink = ({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn('hover:underline', className)}
  >
    {children}
  </Link>
)
