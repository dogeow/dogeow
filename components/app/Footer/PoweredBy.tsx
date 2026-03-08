import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const assetBaseUrl = process.env.NEXT_PUBLIC_ASSET_BASE_URL || ''

const techIcons = {
  laravel: `${assetBaseUrl}/images/tech/laravel.svg`,
  react: `${assetBaseUrl}/images/tech/react.svg`,
  nextJs: `${assetBaseUrl}/images/tech/next-js.svg`,
  shadcn: `${assetBaseUrl}/images/tech/shadcn.svg`,
  typescript: `${assetBaseUrl}/images/tech/typescript.svg`,
  tailwind: `${assetBaseUrl}/images/tech/tailwind.svg`,
}

interface TechLinkProps {
  href: string
  src: string
  alt: string
  needsInvert?: boolean
}

const TechLink: React.FC<TechLinkProps> = ({ href, src, alt, needsInvert }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center text-sm"
  >
    <Image
      src={src}
      alt={alt}
      width={20}
      height={20}
      className={`transition-transform hover:scale-110 ${needsInvert ? 'dark:invert' : ''}`}
    />
  </Link>
)

const PoweredBy: React.FC = () => (
  <div className="flex items-center gap-2 text-sm opacity-80">
    <span>🫴 Powered By</span>
    <TechLink
      href="https://laravel.com"
      src={techIcons.laravel}
      alt="Laravel"
      needsInvert={false}
    />
    <TechLink href="https://react.dev" src={techIcons.react} alt="React" needsInvert={false} />
    <TechLink href="https://nextjs.org" src={techIcons.nextJs} alt="Next.js" needsInvert={true} />
    <TechLink
      href="https://www.typescriptlang.org"
      src={techIcons.typescript}
      alt="TypeScript"
      needsInvert={false}
    />
    <TechLink
      href="https://tailwindcss.com"
      src={techIcons.tailwind}
      alt="Tailwind CSS"
      needsInvert={false}
    />
    <TechLink
      href="https://ui.shadcn.com"
      src={techIcons.shadcn}
      alt="shadcn/ui"
      needsInvert={true}
    />
  </div>
)

export default PoweredBy
